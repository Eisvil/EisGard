import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { verifyWebhookSignature, verifyCardSignature } from '@/lib/payments/ymoney';
import { awardPoints } from '@/lib/points/awardPoints';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const OK = () => new NextResponse(null, { status: 200 });

type DonationRow = {
  id: string;
  user_id: string | null;
  object_id: string | null;
  slot_id: string | null;
  status: string;
  is_anonymous: boolean;
  display_name: string;
  subscription_id: string | null;
};

type SettingRow = { value: unknown };

export async function POST(request: NextRequest) {
  const text = await request.text();
  // URLSearchParams treats '+' as space; ЮMoney sends datetime with literal '+03:00'
  // so we must use decodeURIComponent to preserve '+' signs for correct SHA-1 verification
  const params: Record<string, string> = {};
  for (const pair of text.split('&')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      params[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
    }
  }

  const {
    notification_type = '',
    operation_id = '',
    amount = '',
    currency = '',
    datetime = '',
    sender = '',
    codepro = '',
    label = '',
    sha1_hash = '',
    // card-incoming payments use 'sign' instead of 'sha1_hash'
    sign = '',
  } = params;

  const receivedHash = sha1_hash || sign;
  const unaccepted = params['unaccepted'] ?? '';

  console.log('[ymoney] type:', notification_type, '| op:', operation_id);
  console.log('[ymoney] sha1_hash:', sha1_hash || '(empty)', '| sign:', sign || '(empty)');
  console.log('[ymoney] receivedHash:', receivedHash || '(empty)', '| unaccepted:', unaccepted || '(empty)');
  console.log('[ymoney] secret_len:', (process.env.YMONEY_NOTIFICATION_SECRET ?? '').length);

  const secret = process.env.YMONEY_NOTIFICATION_SECRET ?? '';
  const valid = notification_type === 'card-incoming'
    ? verifyCardSignature(
        { notification_type, operation_id, amount, currency, datetime, sender, codepro, label, sha1_hash: receivedHash },
        secret,
        unaccepted,
      )
    : verifyWebhookSignature(
        { notification_type, operation_id, amount, currency, datetime, sender, codepro, label, sha1_hash: receivedHash },
        secret,
      );

  console.log('[ymoney] SHA-1 valid:', valid);

  if (!valid) {
    console.warn('[ymoney webhook] invalid SHA-1, operation_id:', operation_id);
    return OK();
  }

  if (!label) return OK();

  const supabase = (await createServiceSupabaseClient()) as AnyClient;

  const { data: donation } = await supabase
    .from('donations')
    .select('id, user_id, object_id, slot_id, status, is_anonymous, display_name, subscription_id')
    .eq('id', label)
    .maybeSingle() as { data: DonationRow | null };

  if (!donation) return OK();
  if (donation.status === 'confirmed') return OK();

  const amountKopecks = Math.round(parseFloat(amount) * 100);

  await supabase.from('donations').update({
    status: 'confirmed',
    ymoney_operation_id: operation_id,
    confirmed_at: new Date().toISOString(),
    amount_kopecks: amountKopecks,
  }).eq('id', donation.id);

  const { data: settingRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'points_per_ruble')
    .maybeSingle() as { data: SettingRow | null };

  const ppr = Number(settingRow?.value ?? 1);
  const pts = Math.floor((amountKopecks / 100) * ppr);

  if (donation.user_id && pts > 0) {
    await awardPoints(donation.user_id, pts);
    await supabase.from('donations').update({ points_awarded: pts }).eq('id', donation.id);
  }

  if (donation.slot_id) {
    await supabase.rpc('increment_slot_value', {
      p_slot_id: donation.slot_id,
      p_value: amountKopecks,
    });
  }

  if (donation.object_id) {
    await supabase.rpc('increment_object_raised', {
      p_object_id: donation.object_id,
      p_value: amountKopecks,
    });
  }

  await supabase.from('chronicle_events').insert({
    event_type: 'donation',
    user_id: donation.user_id ?? null,
    object_id: donation.object_id ?? null,
    display_name: donation.is_anonymous ? 'Аноним' : (donation.display_name || 'Участник'),
    is_anonymous: donation.is_anonymous,
    amount_kopecks: amountKopecks,
    points: pts > 0 ? pts : null,
  });

  // Если платёж связан с подпиской — активируем её и сохраняем токен если пришёл
  if (donation.subscription_id) {
    const token = params['token'] ?? '';
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_date: new Date().toISOString().slice(0, 10),
        ...(token ? { ymoney_token: token } : {}),
      })
      .eq('id', donation.subscription_id)
      .eq('status', 'pending');
  }

  return OK();
}
