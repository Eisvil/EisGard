import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { awardPoints } from '@/lib/points/awardPoints';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  status: z.enum(['approved', 'rejected', 'completed']),
  admin_note: z.string().max(500).optional(),
  days_worked: z.number().int().min(0).optional(),
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

  const { status, admin_note, days_worked } = parsed.data;

  // Загружаем заявку вместе с заездом
  const { data: app, error: appErr } = await supabase
    .from('volunteer_applications')
    .select('id, status, user_id, camp_id, volunteer_camps(date_from, date_to)')
    .eq('id', id)
    .maybeSingle() as {
    data: {
      id: string;
      status: string;
      user_id: string;
      camp_id: string;
      volunteer_camps: { date_from: string; date_to: string } | null;
    } | null;
    error: unknown;
  };

  if (appErr || !app) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Заявка не найдена' } },
      { status: 404 },
    );
  }

  // --- Одобрение / Отклонение ---
  if (status === 'approved' || status === 'rejected') {
    await supabase
      .from('volunteer_applications')
      .update({ status, admin_note: admin_note ?? null })
      .eq('id', id);

    return NextResponse.json({ data: { updated: true, points_awarded: 0 } });
  }

  // --- Завершение ---
  if (app.status === 'completed') {
    return NextResponse.json(
      { error: { code: 'ALREADY_COMPLETED', message: 'Заявка уже завершена' } },
      { status: 400 },
    );
  }

  if (days_worked === undefined || days_worked === null) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Укажите количество дней' } },
      { status: 400 },
    );
  }

  // Проверка: days_worked не превышает длину заезда
  if (app.volunteer_camps) {
    const from = new Date(app.volunteer_camps.date_from);
    const to = new Date(app.volunteer_camps.date_to);
    const campDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    if (days_worked > campDays) {
      return NextResponse.json(
        { error: { code: 'DAYS_EXCEED_CAMP', message: `Максимум ${campDays} дней для этого заезда` } },
        { status: 400 },
      );
    }
  }

  // points_per_day из settings
  const { data: settingRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'points_per_day')
    .maybeSingle() as { data: { value: unknown } | null };

  const pointsPerDay = Number(settingRow?.value ?? 1000);
  const pointsAwarded = days_worked * pointsPerDay;

  // Обновляем заявку
  await supabase
    .from('volunteer_applications')
    .update({
      status: 'completed',
      days_worked,
      points_awarded: pointsAwarded,
      admin_note: admin_note ?? null,
    })
    .eq('id', id);

  // Начисляем баллы
  const serviceClient = (await createServiceSupabaseClient()) as AnyClient;
  await awardPoints(app.user_id, pointsAwarded);

  // Запись в летопись
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', app.user_id)
    .maybeSingle() as { data: { full_name: string } | null };

  const campName = app.volunteer_camps
    ? `заезд ${app.volunteer_camps.date_from}–${app.volunteer_camps.date_to}`
    : 'заезд';

  await serviceClient.from('chronicle_events').insert({
    event_type: 'volunteer',
    user_id: app.user_id,
    display_name: profile?.full_name ?? 'Участник',
    is_anonymous: false,
    points: pointsAwarded,
    description: `Отработал ${days_worked} ${days_worked === 1 ? 'день' : days_worked < 5 ? 'дня' : 'дней'} на ${campName}`,
  });

  return NextResponse.json({ data: { updated: true, points_awarded: pointsAwarded } });
}
