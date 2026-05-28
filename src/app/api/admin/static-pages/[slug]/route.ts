import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { revalidatePath } from 'next/cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const ALLOWED_SLUGS = ['about', 'privacy', 'personal-data'] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { slug } = await params;

  if (!ALLOWED_SLUGS.includes(slug as (typeof ALLOWED_SLUGS)[number])) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Страница не найдена' } },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from('static_pages')
    .select('slug, title, body, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Страница не найдена' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

const patchSchema = z.object({
  body: z.record(z.string(), z.unknown()),
  title: z.string().min(2).max(200).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { slug } = await params;

  if (!ALLOWED_SLUGS.includes(slug as (typeof ALLOWED_SLUGS)[number])) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Страница не найдена' } },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = { body: parsed.data.body, updated_at: new Date().toISOString() };
  if (parsed.data.title) update.title = parsed.data.title;

  const { error } = await supabase
    .from('static_pages')
    .update(update)
    .eq('slug', slug);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  revalidatePath(`/${slug}`);

  return NextResponse.json({ data: { updated: true } });
}
