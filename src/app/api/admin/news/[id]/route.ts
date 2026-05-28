import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { revalidatePath } from 'next/cache';

const patchNewsSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  summary: z.string().max(500).nullable().optional(),
  body: z.record(z.string(), z.unknown()).optional(),
  cover_url: z.string().url().nullable().optional(),
  tag: z.string().max(60).nullable().optional(),
  published: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { data, error } = await supabase
    .from('news')
    .select('id, slug, title, summary, body, cover_url, tag, published, published_at, created_at')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = patchNewsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.published === true) {
    updates.published_at = new Date().toISOString();
  } else if (parsed.data.published === false) {
    updates.published_at = null;
  }

  const { data: existing } = await supabase
    .from('news')
    .select('slug')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('news')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  revalidatePath('/');
  if (existing?.slug) {
    revalidatePath(`/news/${existing.slug}`);
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { data: news } = await supabase
    .from('news')
    .select('published, slug')
    .eq('id', id)
    .single();

  if (!news) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (news.published) {
    return NextResponse.json(
      { error: { code: 'PUBLISHED_NEWS', message: 'Снимите с публикации перед удалением' } },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('news').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  revalidatePath('/');
  return NextResponse.json({ data: { deleted: true } });
}
