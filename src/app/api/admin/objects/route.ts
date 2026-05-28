import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const createObjectSchema = z.object({
  name:        z.string().min(2).max(120),
  slug:        z.string().regex(/^[a-z0-9-]+$/).min(2).max(60),
  zone:        z.enum(['craft', 'public', 'farming', 'military', 'residential']),
  status:      z.enum(['draft', 'planned', 'building', 'done', 'working']).default('draft'),
  description: z.string().max(5000).optional().nullable(),
  cover_url:   z.string().url().optional().nullable(),
  icon_key:    z.string().max(60).optional().nullable(),
  short_name:  z.string().max(30).optional().nullable(),
  sort_order:  z.number().int().optional(),
  map_position_x: z.number().min(0).max(100).optional().nullable(),
  map_position_y: z.number().min(0).max(100).optional().nullable(),
});

export async function GET() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;
  const { data, error } = await supabase
    .from('objects')
    .select('id, slug, name, short_name, zone, status, sort_order, total_goal_rub, total_raised_rub, icon_key, map_position_x, map_position_y, created_at')
    .order('sort_order');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка запроса' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(['admin']);
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

  const parsed = createObjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { supabase } = ctx;
  const data = parsed.data;

  // Проверить уникальность slug
  const { data: existing } = await supabase
    .from('objects')
    .select('id')
    .eq('slug', data.slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: { code: 'SLUG_EXISTS', message: 'Объект с таким slug уже существует' } },
      { status: 409 },
    );
  }

  const { data: created, error } = await supabase
    .from('objects')
    .insert({
      name:           data.name,
      slug:           data.slug,
      zone:           data.zone,
      status:         data.status,
      description:    data.description ?? null,
      cover_url:      data.cover_url ?? null,
      icon_key:       data.icon_key ?? null,
      short_name:     data.short_name ?? null,
      sort_order:     data.sort_order ?? 0,
      map_position_x: data.map_position_x ?? null,
      map_position_y: data.map_position_y ?? null,
    })
    .select('id, slug')
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка создания объекта' } },
      { status: 500 },
    );
  }

  if (data.status !== 'draft') {
    revalidatePath('/');
  }

  return NextResponse.json({ data: { id: created.id, slug: created.slug } }, { status: 201 });
}
