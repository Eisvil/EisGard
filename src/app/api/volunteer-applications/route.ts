import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/utils/zod';
import { rateLimit } from '@/lib/rateLimit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const schema = z.object({
  camp_id: uuidSchema,
  skill_ids: z.array(uuidSchema).default([]),
  comment: z.string().max(1000).optional(),
});

const ERROR_STATUS: Record<string, number> = {
  NOT_FOUND: 404,
  CAMP_CLOSED: 409,
  CAMP_FULL: 409,
  ALREADY_APPLIED: 409,
};

const ERROR_MESSAGE: Record<string, string> = {
  NOT_FOUND: 'Заезд не найден',
  CAMP_CLOSED: 'Набор на этот заезд закрыт',
  CAMP_FULL: 'Все места на этот заезд заняты',
  ALREADY_APPLIED: 'Вы уже подали заявку на этот заезд',
};

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

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

  const { camp_id, skill_ids, comment } = parsed.data;

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
      { status: 401 }
    );
  }

  // Atomically check availability and insert — prevents race condition overbooking
  const { data: rpcRows, error: rpcError } = await supabase.rpc('apply_volunteer_atomic', {
    p_user_id: user.id,
    p_camp_id: camp_id,
    p_comment: comment ?? null,
  }) as { data: { success: boolean; error_code: string | null }[] | null; error: unknown };

  if (rpcError || !rpcRows) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать заявку' } },
      { status: 500 }
    );
  }

  const result = rpcRows[0];
  if (!result?.success) {
    const code = result?.error_code ?? 'DB_ERROR';
    return NextResponse.json(
      { error: { code, message: ERROR_MESSAGE[code] ?? 'Ошибка создания заявки' } },
      { status: ERROR_STATUS[code] ?? 500 }
    );
  }

  // Fetch the newly created application id
  const { data: rawApp } = await supabase
    .from('volunteer_applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('camp_id', camp_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const app = rawApp as { id: string; status: string } | null;

  // Upsert selected skills into user_skills
  if (skill_ids.length > 0) {
    const skillRows = skill_ids.map((skill_id) => ({ user_id: user.id, skill_id }));
    await supabase
      .from('user_skills')
      .upsert(skillRows, { onConflict: 'user_id,skill_id', ignoreDuplicates: true });
  }

  return NextResponse.json(
    { data: { id: app?.id ?? null, status: app?.status ?? 'pending' } },
    { status: 201 }
  );
}
