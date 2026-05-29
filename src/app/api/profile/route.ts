import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/utils/zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  in_chronicle: z.boolean().optional(),
  skill_ids: z.array(uuidSchema).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export async function GET() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 },
    );
  }

  const [
    profileResult,
    skillsResult,
    donationsStatsResult,
    volunteerStatsResult,
    materialsStatsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, birth_date, points, role, in_chronicle, title_id, titles(id, name, min_points, description, privileges)')
      .eq('id', user.id)
      .maybeSingle() as Promise<{ data: any }>,

    supabase
      .from('user_skills')
      .select('skills(id, name, category)')
      .eq('user_id', user.id) as Promise<{ data: any[] | null }>,

    supabase
      .from('donations')
      .select('amount_kopecks')
      .eq('user_id', user.id)
      .eq('status', 'confirmed') as Promise<{ data: any[] | null }>,

    supabase
      .from('volunteer_applications')
      .select('days_worked')
      .eq('user_id', user.id)
      .eq('status', 'completed') as Promise<{ data: any[] | null }>,

    supabase
      .from('material_applications')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'received') as Promise<{ data: any[] | null }>,
  ]);

  const profile = profileResult.data;
  if (!profile) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Профиль не найден' } },
      { status: 404 },
    );
  }

  const currentTitle = profile.titles ?? null;
  const currentMinPoints = currentTitle?.min_points ?? 0;

  const { data: nextTitleData } = (await supabase
    .from('titles')
    .select('id, name, min_points')
    .gt('min_points', profile.points)
    .order('min_points', { ascending: true })
    .limit(1)
    .maybeSingle()) as { data: any };

  const skills = (skillsResult.data ?? [])
    .map((row: any) => row.skills)
    .filter(Boolean);

  const totalDonatedKopecks = (donationsStatsResult.data ?? []).reduce(
    (sum: number, d: any) => sum + (d.amount_kopecks ?? 0),
    0,
  );

  const totalVolunteerDays = (volunteerStatsResult.data ?? []).reduce(
    (sum: number, v: any) => sum + (v.days_worked ?? 0),
    0,
  );

  const totalMaterialsCount = (materialsStatsResult.data ?? []).length;

  return NextResponse.json({
    data: {
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        birth_date: profile.birth_date,
        points: profile.points,
        role: profile.role,
        in_chronicle: profile.in_chronicle,
      },
      title: currentTitle
        ? {
            id: currentTitle.id,
            name: currentTitle.name,
            min_points: currentTitle.min_points,
            description: currentTitle.description,
            privileges: currentTitle.privileges,
          }
        : null,
      next_title: nextTitleData
        ? {
            id: nextTitleData.id,
            name: nextTitleData.name,
            min_points: nextTitleData.min_points,
          }
        : null,
      current_title_min_points: currentMinPoints,
      skills,
      stats: {
        total_donated_kopecks: totalDonatedKopecks,
        total_volunteer_days: totalVolunteerDays,
        total_materials_count: totalMaterialsCount,
      },
    },
  });
}

export async function PATCH(request: NextRequest) {
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

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 },
    );
  }

  const { skill_ids, ...profileFields } = parsed.data;

  const profileUpdate: Record<string, unknown> = {};
  if (profileFields.full_name !== undefined) profileUpdate.full_name = profileFields.full_name;
  if (profileFields.birth_date !== undefined) profileUpdate.birth_date = profileFields.birth_date;
  if (profileFields.in_chronicle !== undefined) profileUpdate.in_chronicle = profileFields.in_chronicle;
  if (profileFields.avatar_url !== undefined) profileUpdate.avatar_url = profileFields.avatar_url;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id);
    if (error) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: 'Ошибка обновления профиля' } },
        { status: 500 },
      );
    }
  }

  if (skill_ids !== undefined) {
    await supabase.from('user_skills').delete().eq('user_id', user.id);
    if (skill_ids.length > 0) {
      const rows = skill_ids.map((skillId) => ({
        user_id: user.id,
        skill_id: skillId,
      }));
      const { error } = await supabase.from('user_skills').insert(rows);
      if (error) {
        return NextResponse.json(
          { error: { code: 'DB_ERROR', message: 'Ошибка обновления навыков' } },
          { status: 500 },
        );
      }
    }
  }

  return NextResponse.json({ data: { updated: true } });
}
