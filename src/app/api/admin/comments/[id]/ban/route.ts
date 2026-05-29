import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Params = { id: string };

const schema = z.object({
  duration: z.enum(['1h', '1d', '1m', 'permanent']),
  reason: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;

  const authResult = await requireAdmin(['admin', 'moderator']);
  if (authResult instanceof Response) return authResult;
  const { userId: adminId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON' } }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const supabase = (await createServerSupabaseClient()) as AnyClient;

  // Получить автора комментария
  const { data: comment } = await supabase
    .from('object_comments')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle() as { data: { id: string; user_id: string } | null };

  if (!comment) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  // Нельзя забанить себя или другого админа/модератора
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', comment.user_id)
    .maybeSingle() as { data: { role: string } | null };

  if (targetProfile?.role === 'admin') {
    return NextResponse.json(
      { error: { code: 'CANNOT_BAN_ADMIN', message: 'Нельзя заблокировать администратора' } },
      { status: 403 }
    );
  }

  const { duration, reason } = parsed.data;

  let bannedUntil: string | null = null;
  if (duration !== 'permanent') {
    const until = new Date();
    if (duration === '1h') until.setHours(until.getHours() + 1);
    else if (duration === '1d') until.setDate(until.getDate() + 1);
    else if (duration === '1m') until.setMonth(until.getMonth() + 1);
    bannedUntil = until.toISOString();
  }

  // Деактивировать предыдущие баны
  await supabase
    .from('comment_bans')
    .update({ is_active: false })
    .eq('user_id', comment.user_id)
    .eq('is_active', true);

  // Создать новый бан
  const { error } = await supabase
    .from('comment_bans')
    .insert({
      user_id: comment.user_id,
      banned_by: adminId,
      banned_until: bannedUntil,
      reason: reason ?? null,
      is_active: true,
    }) as { error: unknown };

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  return NextResponse.json({ data: { banned: true, banned_until: bannedUntil } }, { status: 201 });
}
