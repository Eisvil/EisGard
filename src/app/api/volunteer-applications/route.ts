import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/utils/zod';

const schema = z.object({
  camp_id: uuidSchema,
  skill_ids: z.array(uuidSchema).default([]),
  comment: z.string().max(1000).optional(),
});

type CampRow = {
  id: string;
  is_open: boolean;
  max_volunteers: number;
};

type AppRow = {
  camp_id: string;
};

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

  const { camp_id, skill_ids, comment } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
      { status: 401 }
    );
  }

  // Verify camp exists and is open
  const { data: rawCamp } = await supabase
    .from('volunteer_camps')
    .select('id, is_open, max_volunteers')
    .eq('id', camp_id)
    .maybeSingle();

  const camp = rawCamp as CampRow | null;
  if (!camp) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Заезд не найден' } },
      { status: 404 }
    );
  }

  if (!camp.is_open) {
    return NextResponse.json(
      { error: { code: 'CAMP_CLOSED', message: 'Набор на этот заезд закрыт' } },
      { status: 409 }
    );
  }

  // Count current active applications
  const { data: rawApps } = await supabase
    .from('volunteer_applications')
    .select('camp_id')
    .eq('camp_id', camp_id)
    .in('status', ['pending', 'approved']);

  const taken = ((rawApps ?? []) as AppRow[]).length;
  if (taken >= camp.max_volunteers) {
    return NextResponse.json(
      { error: { code: 'CAMP_FULL', message: 'Все места на этот заезд заняты' } },
      { status: 409 }
    );
  }

  // Insert application
  const { data: rawApp, error: insertError } = await supabase
    .from('volunteer_applications')
    .insert({
      user_id: user.id,
      camp_id,
      comment: comment ?? null,
      status: 'pending',
    })
    .select('id, status')
    .single();

  if (insertError) {
    // UNIQUE violation: (user_id, camp_id)
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: { code: 'ALREADY_APPLIED', message: 'Вы уже подали заявку на этот заезд' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать заявку' } },
      { status: 500 }
    );
  }

  const app = rawApp as { id: string; status: string };

  // Upsert selected skills into user_skills
  if (skill_ids.length > 0) {
    const skillRows = skill_ids.map((skill_id) => ({ user_id: user.id, skill_id }));
    await supabase
      .from('user_skills')
      .upsert(skillRows, { onConflict: 'user_id,skill_id', ignoreDuplicates: true });
  }

  return NextResponse.json({ data: { id: app.id, status: app.status } }, { status: 201 });
}
