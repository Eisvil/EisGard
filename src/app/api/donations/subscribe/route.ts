import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildQuickpayUrl } from '@/lib/payments/ymoney';
import { uuidSchema } from '@/lib/utils/zod';

const schema = z.object({
  object_id: uuidSchema.nullable().optional(),
  amount_kopecks: z.number().int().min(10000, 'Минимальная сумма 100 ₽'),
  display_name: z.string().min(2).max(120),
  is_anonymous: z.boolean(),
  object_slug: z.string().nullable().optional(),
});

type AnyClient = any;

function firstOfNextMonth(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некорректный запрос' } },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 }
    );
  }

  const { object_id, amount_kopecks, display_name, is_anonymous, object_slug } = parsed.data;

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 }
    );
  }

  let objectName = 'Живое Городище';

  if (object_id) {
    const { data: obj } = await supabase
      .from('objects')
      .select('id, name, status')
      .eq('id', object_id)
      .neq('status', 'draft')
      .maybeSingle() as { data: { id: string; name: string; status: string } | null };

    if (!obj) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
        { status: 404 }
      );
    }
    objectName = obj.name;
  }

  // Блокируем только подтверждённые подписки (active / paused)
  const existingQuery = supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused']);

  if (object_id) {
    existingQuery.eq('object_id', object_id);
  } else {
    existingQuery.is('object_id', null);
  }

  const { data: existing } = await existingQuery.maybeSingle() as { data: { id: string } | null };

  if (existing) {
    return NextResponse.json(
      { error: { code: 'ALREADY_SUBSCRIBED', message: 'У вас уже есть активная подписка' } },
      { status: 409 }
    );
  }

  // Удаляем брошенные pending-подписки
  const deleteQuery = supabase
    .from('subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (object_id) {
    deleteQuery.eq('object_id', object_id);
  } else {
    deleteQuery.is('object_id', null);
  }
  await deleteQuery;

  const nextPaymentDate = firstOfNextMonth();

  // Создаём подписку со статусом 'pending' — станет 'active' на вебхуке
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      object_id,
      amount_kopecks,
      ymoney_token: null,
      status: 'pending',
      next_payment_date: nextPaymentDate,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown };

  if (subError || !subscription) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать подписку' } },
      { status: 500 }
    );
  }

  const { data: donation, error: donError } = await supabase
    .from('donations')
    .insert({
      user_id: user.id,
      object_id,
      slot_id: null,
      amount_kopecks,
      display_name,
      is_anonymous,
      source: 'ymoney',
      status: 'pending',
      subscription_id: subscription.id,
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown };

  if (donError || !donation) {
    await supabase.from('subscriptions').delete().eq('id', subscription.id);
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать пожертвование' } },
      { status: 500 }
    );
  }

  const wallet = process.env.YMONEY_WALLET;
  if (!wallet) {
    return NextResponse.json(
      { error: { code: 'CONFIG_ERROR', message: 'Платёжный сервис не настроен' } },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const successURL = object_slug
    ? `${siteUrl}/objects/${object_slug}?donated=true`
    : `${siteUrl}/?donated=true`;

  const redirect_url = buildQuickpayUrl({
    wallet,
    sum: amount_kopecks / 100,
    label: donation.id,
    targets: `Ежемесячная поддержка: ${objectName}`,
    successURL,
  });

  return NextResponse.json(
    { data: { subscription_id: subscription.id, donation_id: donation.id, redirect_url } },
    { status: 201 }
  );
}
