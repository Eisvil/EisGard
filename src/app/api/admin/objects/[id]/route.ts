import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const patchObjectSchema = z.object({
  name:           z.string().min(2).max(120).optional(),
  slug:           z.string().regex(/^[a-z0-9-]+$/).min(2).max(60).optional(),
  zone:           z.enum(['craft', 'public', 'farming', 'military', 'residential']).optional(),
  status:         z.enum(['draft', 'planned', 'building', 'done', 'working']).optional(),
  description:    z.string().max(5000).optional().nullable(),
  cover_url:      z.string().optional().nullable(),
  icon_key:       z.string().max(60).optional().nullable(),
  short_name:     z.string().max(30).optional().nullable(),
  map_position_x: z.number().min(0).max(100).optional().nullable(),
  map_position_y: z.number().min(0).max(100).optional().nullable(),
  sort_order:     z.number().int().optional(),
  total_goal_rub: z.number().int().min(0).optional(),
  allow_comments: z.boolean().optional(),
  historical_note: z.record(z.string(), z.unknown()).nullable().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;
  const { data, error } = await supabase
    .from('objects')
    .select('*, slots(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка запроса' } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 },
    );
  }

  const parsed = patchObjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { supabase } = ctx;

  // Получить текущий объект (нужен old slug и текущий статус)
  const { data: current } = await supabase
    .from('objects')
    .select('id, slug, status')
    .eq('id', id)
    .maybeSingle() as { data: { id: string; slug: string; status: string } | null };

  if (!current) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
      { status: 404 },
    );
  }

  const data = parsed.data;

  // Проверить публикацию: нельзя выставить статус != 'draft' без слотов
  const newStatus = data.status;
  if (newStatus && newStatus !== 'draft' && current.status === 'draft') {
    const { count } = await supabase
      .from('slots')
      .select('id', { count: 'exact', head: true })
      .eq('object_id', id) as { count: number | null };

    if (!count || count === 0) {
      return NextResponse.json(
        { error: { code: 'NO_SLOTS', message: 'Нельзя опубликовать объект без слотов' } },
        { status: 422 },
      );
    }
  }

  // Проверить уникальность slug при изменении
  if (data.slug && data.slug !== current.slug) {
    const { data: existing } = await supabase
      .from('objects')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: { code: 'SLUG_EXISTS', message: 'Объект с таким slug уже существует' } },
        { status: 409 },
      );
    }
  }

  // Собрать только переданные поля
  const updateFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) updateFields[key] = val;
  }

  const { error } = await supabase
    .from('objects')
    .update(updateFields)
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка обновления объекта' } },
      { status: 500 },
    );
  }

  const effectiveSlug = data.slug ?? current.slug;
  revalidatePath('/');
  revalidatePath(`/objects/${effectiveSlug}`);
  if (data.slug && data.slug !== current.slug) {
    revalidatePath(`/objects/${current.slug}`);
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;

  const { data: obj } = await supabase
    .from('objects')
    .select('slug')
    .eq('id', id)
    .maybeSingle() as { data: { slug: string } | null };

  if (!obj) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from('objects')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка удаления объекта' } },
      { status: 500 },
    );
  }

  revalidatePath('/');
  revalidatePath(`/objects/${obj.slug}`);

  return NextResponse.json({ data: { deleted: true } });
}
