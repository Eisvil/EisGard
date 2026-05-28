import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { awardPoints } from '@/lib/points/awardPoints';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  status: z.enum(['contacted', 'not_contacted', 'received', 'cancelled']),
  actual_qty: z.number().positive().optional(),
  points_awarded: z.number().int().min(0).optional(),
  admin_note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;

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

  const { status, actual_qty, points_awarded, admin_note } = parsed.data;

  // Загружаем заявку
  const { data: app, error: appErr } = await supabase
    .from('material_applications')
    .select('id, status, user_id, material_id')
    .eq('id', id)
    .maybeSingle() as {
    data: { id: string; status: string; user_id: string; material_id: string } | null;
    error: unknown;
  };

  if (appErr || !app) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Заявка не найдена' } },
      { status: 404 },
    );
  }

  // --- Статусы без дополнительных действий ---
  if (status === 'contacted' || status === 'not_contacted' || status === 'cancelled') {
    await supabase
      .from('material_applications')
      .update({ status, admin_note: admin_note ?? null })
      .eq('id', id);

    return NextResponse.json({ data: { updated: true, points_awarded: 0 } });
  }

  // --- Получено ---
  if (!actual_qty) {
    return NextResponse.json(
      { error: { code: 'ACTUAL_QTY_REQUIRED', message: 'Укажите фактическое количество' } },
      { status: 400 },
    );
  }

  const pts = points_awarded ?? 0;

  // Обновляем заявку (DB-триггер material_app_received обновит materials.received_qty)
  await supabase
    .from('material_applications')
    .update({
      status: 'received',
      actual_qty,
      points_awarded: pts,
      admin_note: admin_note ?? null,
    })
    .eq('id', id);

  // Начисляем баллы пользователю
  if (app.user_id && pts > 0) {
    await awardPoints(app.user_id, pts);
  }

  return NextResponse.json({ data: { updated: true, points_awarded: pts } });
}
