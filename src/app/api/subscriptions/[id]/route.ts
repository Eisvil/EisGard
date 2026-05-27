import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type AnyClient = any;
type SubscriptionRow = { id: string; user_id: string; status: string };

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 }
    );
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id, status')
    .eq('id', id)
    .maybeSingle() as { data: SubscriptionRow | null };

  if (!subscription) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Подписка не найдена' } },
      { status: 404 }
    );
  }

  if (subscription.user_id !== user.id) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Это не ваша подписка' } },
      { status: 403 }
    );
  }

  if (subscription.status === 'cancelled') {
    return NextResponse.json(
      { error: { code: 'ALREADY_CANCELLED', message: 'Подписка уже отменена' } },
      { status: 400 }
    );
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', id);

  return NextResponse.json({ data: { cancelled: true } });
}
