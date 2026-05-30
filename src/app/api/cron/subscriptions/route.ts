import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/points/awardPoints';

type AnyClient = any;

type SubscriptionRow = {
  id: string;
  user_id: string;
  object_id: string | null;
  amount_kopecks: number;
  ymoney_token: string;
  failed_attempts: number;
};

type SettingRow = { value: unknown };

function addOneMonth(dateStr: string): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  const expected = `Bearer ${cronSecret ?? ''}`;
  const isValid = cronSecret &&
    authHeader !== null &&
    expected.length === authHeader.length &&
    timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(authHeader, 'utf8'));

  if (!isValid) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Неверный секрет' } },
      { status: 401 }
    );
  }

  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const today = new Date().toISOString().slice(0, 10);

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('id, user_id, object_id, amount_kopecks, ymoney_token, failed_attempts')
    .eq('status', 'active')
    .not('ymoney_token', 'is', null)
    .lte('next_payment_date', today) as { data: SubscriptionRow[] | null };

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ data: { processed: 0, paused: 0 } });
  }

  const { data: settingRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'points_per_ruble')
    .maybeSingle() as { data: SettingRow | null };

  const ppr = Number(settingRow?.value ?? 1);

  let processed = 0;
  let paused = 0;

  for (const sub of subscriptions) {
    // Попытка списания по токену (заглушка — merchant API не подключён)
    // TODO: когда будут получены YooKassa merchant credentials,
    // заменить на реальный вызов request-payment + process-payment API.
    const paymentSuccess = await attemptCharge(sub.ymoney_token, sub.amount_kopecks);

    if (paymentSuccess) {
      const { data: donation } = await supabase
        .from('donations')
        .insert({
          user_id: sub.user_id,
          object_id: sub.object_id,
          slot_id: null,
          amount_kopecks: sub.amount_kopecks,
          display_name: '',
          is_anonymous: false,
          source: 'ymoney',
          status: 'confirmed',
          subscription_id: sub.id,
          confirmed_at: new Date().toISOString(),
        })
        .select('id')
        .single() as { data: { id: string } | null };

      if (donation) {
        const pts = Math.floor((sub.amount_kopecks / 100) * ppr);
        if (pts > 0) {
          await awardPoints(sub.user_id, pts);
          await supabase
            .from('donations')
            .update({ points_awarded: pts })
            .eq('id', donation.id);
        }

        if (sub.object_id) {
          await supabase.rpc('increment_object_raised', {
            p_object_id: sub.object_id,
            p_value: sub.amount_kopecks,
          });
        }

        await supabase.from('chronicle_events').insert({
          event_type: 'donation',
          user_id: sub.user_id,
          object_id: sub.object_id,
          display_name: 'Участник',
          is_anonymous: false,
          amount_kopecks: sub.amount_kopecks,
          points: pts > 0 ? pts : null,
        });
      }

      await supabase
        .from('subscriptions')
        .update({
          last_payment_date: today,
          next_payment_date: addOneMonth(today),
          failed_attempts: 0,
        })
        .eq('id', sub.id);

      processed++;
    } else {
      const newAttempts = sub.failed_attempts + 1;
      const updateData: Record<string, unknown> = { failed_attempts: newAttempts };
      if (newAttempts >= 2) {
        updateData.status = 'paused';
        paused++;
      }
      await supabase.from('subscriptions').update(updateData).eq('id', sub.id);

      console.warn(`[cron/subscriptions] Ошибка списания для subscription ${sub.id}, попытка ${newAttempts}`);
    }
  }

  return NextResponse.json({ data: { processed, paused } });
}

// Заглушка: реальный вызов ЮMoney merchant API будет здесь
async function attemptCharge(_token: string, _amountKopecks: number): Promise<boolean> {
  // TODO: Реализовать вызов https://yoomoney.ru/api/request-payment + process-payment
  // после получения OAuth access_token для merchant account.
  console.log(`[cron/subscriptions] Попытка списания (merchant API не настроен)`);
  return false;
}
