import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const patchSlotSchema = z.object({
  name:            z.string().min(2).max(120).optional(),
  goal_value:      z.number().int().positive().optional(),
  unit:            z.string().min(1).max(20).optional(),
  is_closed:       z.boolean().optional(),
  sort_order:      z.number().int().optional(),
  current_value:   z.number().int().min(0).optional(),
  image_url:       z.string().url().optional().nullable(),
  description:     z.string().max(1000).optional().nullable(),
  historical_note: z.record(z.string(), z.unknown()).optional().nullable(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = { params: Promise<{ id: string; slotId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, slotId } = await params;
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

  const parsed = patchSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { supabase } = ctx;

  // Проверить что слот принадлежит объекту
  const { data: slot } = await supabase
    .from('slots')
    .select('id, object_id')
    .eq('id', slotId)
    .maybeSingle() as { data: { id: string; object_id: string } | null };

  if (!slot || slot.object_id !== id) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Слот не найден' } },
      { status: 404 },
    );
  }

  const updateFields: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(parsed.data)) {
    if (val !== undefined) updateFields[key] = val;
  }

  const { error } = await supabase
    .from('slots')
    .update(updateFields)
    .eq('id', slotId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка обновления слота' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id, slotId } = await params;
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;

  const { data: slot } = await supabase
    .from('slots')
    .select('id, object_id')
    .eq('id', slotId)
    .maybeSingle() as { data: { id: string; object_id: string } | null };

  if (!slot || slot.object_id !== id) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Слот не найден' } },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from('slots')
    .delete()
    .eq('id', slotId);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка удаления слота' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { deleted: true } });
}
