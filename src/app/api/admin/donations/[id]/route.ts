import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { awardPoints } from '@/lib/points/awardPoints';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import { logAdminAction } from '@/lib/admin/auditLog';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type DonationRow = {
  id: string;
  status: string;
  user_id: string | null;
  object_id: string | null;
  slot_id: string | null;
  amount_kopecks: number;
  points_awarded: number;
  ymoney_operation_id: string | null;
};

const patchSchema = z.object({
  action: z.literal('confirm'),
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
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR' } }, { status: 400 });
  }

  const { data: donation } = await supabase
    .from('donations')
    .select('id, status, user_id, object_id, slot_id, amount_kopecks, points_awarded, ymoney_operation_id')
    .eq('id', id)
    .maybeSingle() as { data: DonationRow | null };

  if (!donation) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Донат не найден' } }, { status: 404 });
  }
  if (donation.status === 'confirmed') {
    return NextResponse.json({ error: { code: 'ALREADY_CONFIRMED', message: 'Донат уже подтверждён' } }, { status: 400 });
  }

  await supabase.from('donations').update({
    status: 'confirmed',
    confirmed_at: new Date().toISOString(),
    ...(donation.ymoney_operation_id == null ? { ymoney_operation_id: `manual-${id}` } : {}),
  }).eq('id', id);

  let ptsAwarded = 0;

  if (donation.user_id && donation.points_awarded === 0) {
    const { data: settingRow } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'points_per_ruble')
      .maybeSingle() as { data: { value: unknown } | null };

    const ppr = Number(settingRow?.value ?? 1);
    ptsAwarded = Math.floor((donation.amount_kopecks / 100) * ppr);

    if (ptsAwarded > 0) {
      const serviceClient = (await createServiceSupabaseClient()) as AnyClient;
      await awardPoints(donation.user_id, ptsAwarded);
      await serviceClient.from('donations').update({ points_awarded: ptsAwarded }).eq('id', id);
    }
  }

  if (donation.slot_id) {
    await supabase.rpc('increment_slot_value', {
      p_slot_id: donation.slot_id,
      p_value: donation.amount_kopecks,
    });
  }
  if (donation.object_id) {
    await supabase.rpc('increment_object_raised', {
      p_object_id: donation.object_id,
      p_value: donation.amount_kopecks,
    });
  }

  await logAdminAction(ctx.userId, 'confirm_donation', 'donation', id, {
    amount_kopecks: donation.amount_kopecks,
    points_awarded: ptsAwarded,
    user_id: donation.user_id,
  });

  return NextResponse.json({ data: { confirmed: true, points_awarded: ptsAwarded } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, userId: actorId } = ctx as { supabase: AnyClient; userId: string };

  const { id } = await params;

  const { data: donation } = await supabase
    .from('donations')
    .select('id, status, user_id, points_awarded')
    .eq('id', id)
    .maybeSingle() as { data: Pick<DonationRow, 'id' | 'status' | 'user_id' | 'points_awarded'> | null };

  if (!donation) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Донат не найден' } }, { status: 404 });
  }

  if (donation.status === 'confirmed' && donation.user_id && donation.points_awarded > 0) {
    await awardPoints(donation.user_id, -donation.points_awarded);
  }

  await supabase.from('donations').delete().eq('id', id);

  await logAdminAction(actorId, 'delete_donation', 'donation', id, {
    was_confirmed: donation.status === 'confirmed',
    points_rolled_back: donation.status === 'confirmed' ? donation.points_awarded : 0,
    user_id: donation.user_id,
  });

  return NextResponse.json({ data: { deleted: true } });
}
