import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { logAdminAction } from '@/lib/admin/auditLog';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

const patchSchema = z.object({
  role: z.enum(['user', 'moderator']),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase, userId } = ctx;
  const { id } = await params;

  // Нельзя менять свою роль
  if (userId === id) {
    return NextResponse.json(
      { error: { code: 'CANNOT_CHANGE_OWN_ROLE', message: 'Нельзя изменить свою роль' } },
      { status: 403 },
    );
  }

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

  // Проверяем что цель не является admin
  const { data: target } = await (supabase as unknown as AnyClient)
    .from('profiles')
    .select('role')
    .eq('id', id)
    .maybeSingle() as { data: { role: string } | null };

  if (!target) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Пользователь не найден' } },
      { status: 404 },
    );
  }

  if (target.role === 'admin') {
    return NextResponse.json(
      { error: { code: 'CANNOT_DEMOTE_ADMIN', message: 'Нельзя изменить роль администратора' } },
      { status: 403 },
    );
  }

  const { error } = await (supabase as unknown as AnyClient)
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось обновить роль' } },
      { status: 500 },
    );
  }

  await logAdminAction(userId, 'set_role', 'profile', id, {
    new_role: parsed.data.role,
    previous_role: target.role,
  });

  return NextResponse.json({ data: { updated: true } });
}
