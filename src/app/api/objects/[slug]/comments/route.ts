import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/utils/zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Params = { slug: string };

const postSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  photos: z.array(z.string().url()).max(5).default([]),
  parent_id: uuidSchema.nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = 20;
  const offset = (page - 1) * perPage;

  const supabase = (await createServerSupabaseClient()) as AnyClient;

  // Найти объект
  const { data: object } = await supabase
    .from('objects')
    .select('id, allow_comments')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle() as { data: { id: string; allow_comments: boolean } | null };

  if (!object) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (!object.allow_comments) {
    return NextResponse.json({ data: [], meta: { total: 0, page, per_page: perPage } });
  }

  // Верхние комментарии (без parent_id)
  const { data: comments, count } = await supabase
    .from('object_comments')
    .select(`
      id, body, photos, created_at, updated_at, parent_id,
      user:profiles!user_id(id, full_name, avatar_url)
    `, { count: 'exact' })
    .eq('object_id', object.id)
    .is('parent_id', null)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1) as { data: unknown[] | null; count: number | null };

  if (!comments) {
    return NextResponse.json({ data: [], meta: { total: 0, page, per_page: perPage } });
  }

  // Загружаем ответы для этой страницы комментариев
  const commentIds = (comments as Array<{ id: string }>).map((c) => c.id);
  let replies: unknown[] = [];
  if (commentIds.length > 0) {
    const { data: replyData } = await supabase
      .from('object_comments')
      .select(`
        id, body, photos, created_at, updated_at, parent_id,
        user:profiles!user_id(id, full_name, avatar_url)
      `)
      .in('parent_id', commentIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true }) as { data: unknown[] | null };

    replies = replyData ?? [];
  }

  return NextResponse.json({
    data: comments,
    replies,
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
  }

  // Проверить объект и allow_comments
  const { data: object } = await supabase
    .from('objects')
    .select('id, allow_comments')
    .eq('slug', slug)
    .neq('status', 'draft')
    .maybeSingle() as { data: { id: string; allow_comments: boolean } | null };

  if (!object || !object.allow_comments) {
    return NextResponse.json(
      { error: { code: 'COMMENTS_DISABLED', message: 'Комментарии отключены для этого объекта' } },
      { status: 403 }
    );
  }

  // Проверить бан
  const { data: ban } = await supabase
    .from('comment_bans')
    .select('id, banned_until')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .or('banned_until.is.null,banned_until.gt.' + new Date().toISOString())
    .maybeSingle() as { data: { id: string; banned_until: string | null } | null };

  if (ban) {
    const until = ban.banned_until
      ? `до ${new Date(ban.banned_until).toLocaleDateString('ru-RU')}`
      : 'навсегда';
    return NextResponse.json(
      { error: { code: 'BANNED', message: `Вы лишены права комментировать ${until}` } },
      { status: 403 }
    );
  }

  const { body: commentBody, photos, parent_id } = parsed.data;

  // Если ответ — проверить что родительский комментарий принадлежит этому объекту
  if (parent_id) {
    const { data: parent } = await supabase
      .from('object_comments')
      .select('id, object_id')
      .eq('id', parent_id)
      .eq('is_deleted', false)
      .maybeSingle() as { data: { id: string; object_id: string } | null };

    if (!parent || parent.object_id !== object.id) {
      return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
    }
  }

  const { data: comment, error } = await supabase
    .from('object_comments')
    .insert({
      object_id: object.id,
      user_id: user.id,
      parent_id: parent_id ?? null,
      body: commentBody,
      photos,
    })
    .select(`
      id, body, photos, created_at, updated_at, parent_id,
      user:profiles!user_id(id, full_name, avatar_url)
    `)
    .single() as { data: unknown; error: unknown };

  if (error || !comment) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  return NextResponse.json({ data: comment }, { status: 201 });
}
