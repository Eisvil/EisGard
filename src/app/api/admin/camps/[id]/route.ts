import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  max_volunteers: z.number().int().min(1).optional(),
  description: z.string().max(2000).nullable().optional(),
  is_open: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;
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

  const updates = parsed.data;

  if (updates.date_from !== undefined || updates.date_to !== undefined) {
    const { data: existing } = await (supabase as unknown as AnyClient)
      .from('volunteer_camps')
      .select('date_from, date_to')
      .eq('id', id)
      .maybeSingle();

    const fromDate = updates.date_from ?? (existing as { date_from: string } | null)?.date_from ?? '';
    const toDate = updates.date_to ?? (existing as { date_to: string } | null)?.date_to ?? '';
    if (toDate < fromDate) {
      return NextResponse.json(
        { error: { code: 'INVALID_DATES', message: 'Дата окончания должна быть не раньше даты начала' } },
        { status: 400 },
      );
    }
  }

  const { error } = await (supabase as unknown as AnyClient)
    .from('volunteer_camps')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось обновить заезд' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;
  const { id } = await params;

  const { data: approved } = await (supabase as unknown as AnyClient)
    .from('volunteer_applications')
    .select('id')
    .eq('camp_id', id)
    .eq('status', 'approved')
    .limit(1);

  if (approved && (approved as unknown[]).length > 0) {
    return NextResponse.json(
      { error: { code: 'HAS_APPROVED_APPS', message: 'Нельзя удалить заезд с одобренными заявками' } },
      { status: 400 },
    );
  }

  const { error } = await (supabase as unknown as AnyClient)
    .from('volunteer_camps')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось удалить заезд' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { deleted: true } });
}
