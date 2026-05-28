import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { slugify } from '@/lib/utils/slugify';
import { revalidatePath } from 'next/cache';

const createNewsSchema = z.object({
  title: z.string().min(2).max(200),
  summary: z.string().max(500).optional().nullable(),
  body: z.record(z.string(), z.unknown()).default({}),
  cover_url: z.string().url().optional().nullable(),
  tag: z.string().max(60).optional().nullable(),
  published: z.boolean().default(false),
});

async function buildUniqueSlug(supabase: ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient> extends Promise<infer T> ? T : never, baseSlug: string): Promise<string> {
  const { data } = await supabase
    .from('news')
    .select('slug')
    .like('slug', `${baseSlug}%`);

  const existing = new Set((data ?? []).map((r: { slug: string }) => r.slug));
  if (!existing.has(baseSlug)) return baseSlug;

  let i = 2;
  while (existing.has(`${baseSlug}-${i}`)) i++;
  return `${baseSlug}-${i}`;
}

export async function GET() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { data, error } = await supabase
    .from('news')
    .select('id, slug, title, summary, cover_url, tag, published, published_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, userId } = ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = createNewsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const { title, summary, body: content, cover_url, tag, published } = parsed.data;

  const baseSlug = slugify(title).slice(0, 80);
  const slug = await buildUniqueSlug(supabase, baseSlug);

  const { data: news, error } = await supabase
    .from('news')
    .insert({
      slug,
      title,
      summary: summary ?? null,
      body: content,
      cover_url: cover_url ?? null,
      tag: tag ?? null,
      published,
      published_at: published ? new Date().toISOString() : null,
      author_id: userId,
    })
    .select('id, slug')
    .single();

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  revalidatePath('/');
  revalidatePath('/news/[slug]', 'page');

  return NextResponse.json({ data: { id: news.id, slug: news.slug } }, { status: 201 });
}
