import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Params = { id: string };

const patchSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  photos: z.array(z.string().url()).max(5).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;

  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(reqBody);
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

  const { data: comment } = await supabase
    .from('object_comments')
    .select('id, user_id, created_at, is_deleted')
    .eq('id', id)
    .maybeSingle() as { data: { id: string; user_id: string; created_at: string; is_deleted: boolean } | null };

  if (!comment) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
  }

  if (comment.is_deleted) {
    return NextResponse.json({ error: { code: 'DELETED' } }, { status: 400 });
  }

  const createdAt = new Date(comment.created_at).getTime();
  const editWindow = 24 * 60 * 60 * 1000;
  if (Date.now() - createdAt > editWindow) {
    return NextResponse.json(
      { error: { code: 'EDIT_WINDOW_CLOSED', message: 'Редактировать можно в течение 24 часов' } },
      { status: 403 }
    );
  }

  const updateData: Record<string, unknown> = { body: parsed.data.body };
  if (parsed.data.photos !== undefined) {
    updateData.photos = parsed.data.photos;
  }

  const { data: updated, error } = await supabase
    .from('object_comments')
    .update(updateData)
    .eq('id', id)
    .select(`
      id, body, photos, created_at, updated_at, parent_id,
      user:profiles!user_id(id, full_name, avatar_url)
    `)
    .single() as { data: unknown; error: unknown };

  if (error || !updated) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}
