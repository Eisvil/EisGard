import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/points/awardPoints';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

type SettingRow = { value: unknown };
type UserRow = { id: string; full_name: string; role: string; points: number };

const manualSchema = z.object({
  source: z.enum(['tbank', 'sber', 'manual']),
  amount_kopecks: z.number().int().min(10000, 'Минимальная сумма 100 ₽'),
  display_name: z.string().min(2).max(120),
  donor_email: z.string().email().optional().nullable(),
  object_id: z.string().uuid().optional().nullable(),
  slot_id: z.string().uuid().optional().nullable(),
  is_anonymous: z.boolean().default(false),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(request: Request) {
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

  const parsed = manualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { source, amount_kopecks, display_name, donor_email, object_id, slot_id, is_anonymous, payment_date } = parsed.data;

  // Service role — нужен для chronicle_events INSERT (RLS: service_role only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createServiceSupabaseClient()) as any;

  // 1. Найти профиль по email
  let userId: string | null = null;
  if (donor_email) {
    const { data: userRows } = await supabase
      .rpc('find_user_by_email', { p_email: donor_email });
    const rows = (userRows ?? []) as UserRow[];
    userId = rows[0]?.id ?? null;
  }

  // 2. Создать confirmed donation
  const confirmedAt = payment_date
    ? new Date(payment_date).toISOString()
    : new Date().toISOString();

  const { data: donation, error: insError } = await supabase
    .from('donations')
    .insert({
      user_id: userId,
      object_id: object_id ?? null,
      slot_id: slot_id ?? null,
      amount_kopecks,
      display_name,
      is_anonymous,
      source,
      status: 'confirmed',
      confirmed_at: confirmedAt,
    })
    .select('id')
    .single();

  if (insError || !donation) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать пожертвование' } },
      { status: 500 },
    );
  }

  const donationId = (donation as { id: string }).id;
  let pointsAwarded = 0;

  // 3. Начислить баллы если найден профиль
  if (userId) {
    const { data: settingRow } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'points_per_ruble')
      .maybeSingle() as { data: SettingRow | null };

    const ppr = Number(settingRow?.value ?? 1);
    const pts = Math.floor((amount_kopecks / 100) * ppr);
    if (pts > 0) {
      await awardPoints(userId, pts);
      await supabase.from('donations').update({ points_awarded: pts }).eq('id', donationId);
      pointsAwarded = pts;
    }
  }

  // 4. Обновить прогресс слота
  if (slot_id) {
    await supabase.rpc('increment_slot_value', {
      p_slot_id: slot_id,
      p_value: amount_kopecks,
    });
  }

  // 5. Обновить прогресс объекта
  if (object_id) {
    await supabase.rpc('increment_object_raised', {
      p_object_id: object_id,
      p_value: amount_kopecks,
    });
  }

  // 6. Запись в летопись
  await supabase.from('chronicle_events').insert({
    event_type: 'donation',
    user_id: userId,
    object_id: object_id ?? null,
    display_name: is_anonymous ? 'Аноним' : display_name,
    is_anonymous,
    amount_kopecks,
    points: pointsAwarded > 0 ? pointsAwarded : null,
  });

  return NextResponse.json(
    {
      data: {
        id: donationId,
        status: 'confirmed',
        points_awarded: pointsAwarded,
        user_found: !!userId,
      },
    },
    { status: 201 },
  );
}
