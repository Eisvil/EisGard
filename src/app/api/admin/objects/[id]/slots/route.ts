import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const createSlotSchema = z.object({
  slot_type:       z.enum(['money', 'labor']),
  name:            z.string().min(2).max(120),
  goal_value:      z.number().int().positive(),
  unit:            z.string().min(1).max(20).default('RUB'),
  sort_order:      z.number().int().optional(),
  image_url:       z.string().url().optional().nullable(),
  description:     z.string().max(1000).optional().nullable(),
  historical_note: z.record(z.string(), z.unknown()).optional().nullable(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;
  const { data, error } = await supabase
    .from('slots')
    .select('*')
    .eq('object_id', id)
    .order('sort_order');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка запроса' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const parsed = createSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { supabase } = ctx;

  // Проверить существование объекта
  const { data: obj } = await supabase
    .from('objects')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!obj) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
      { status: 404 },
    );
  }

  const data = parsed.data;
  const { data: created, error } = await supabase
    .from('slots')
    .insert({
      object_id:   id,
      slot_type:   data.slot_type,
      name:        data.name,
      goal_value:  data.goal_value,
      unit:        data.unit,
      sort_order:  data.sort_order ?? 0,
      image_url:       data.image_url ?? null,
      description:     data.description ?? null,
      historical_note: data.historical_note ?? null,
    })
    .select()
    .single();

  if (error || !created) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка создания слота' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: created }, { status: 201 });
}
