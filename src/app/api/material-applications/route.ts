import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const schema = z.object({
  material_id: z.string().uuid(),
  quantity: z.number().positive(),
  contact_phone: z.string().regex(/^\+?[0-9\s\-(]{7,20}$/).optional(),
  contact_telegram: z.string().min(1).max(100).optional(),
  comment: z.string().max(500).optional(),
}).refine(
  (d) => !!(d.contact_phone || d.contact_telegram),
  { message: 'Укажите телефон или Telegram', path: ['contact_phone'] }
);

type MaterialRow = {
  id: string;
  is_active: boolean;
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
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: issue?.message ?? 'Ошибка валидации' } },
      { status: 400 }
    );
  }

  const { material_id, quantity, contact_phone, contact_telegram, comment } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
      { status: 401 }
    );
  }

  // Verify material exists and is active
  const { data: rawMaterial } = await supabase
    .from('materials')
    .select('id, is_active')
    .eq('id', material_id)
    .maybeSingle();

  const material = rawMaterial as MaterialRow | null;
  if (!material) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Материал не найден' } },
      { status: 404 }
    );
  }
  if (!material.is_active) {
    return NextResponse.json(
      { error: { code: 'MATERIAL_INACTIVE', message: 'Этот материал больше не принимается' } },
      { status: 409 }
    );
  }

  const { data: rawApp, error: insertError } = await supabase
    .from('material_applications')
    .insert({
      user_id: user.id,
      material_id,
      quantity,
      contact_phone: contact_phone ?? null,
      contact_telegram: contact_telegram ?? null,
      comment: comment ?? null,
      status: 'pending',
    })
    .select('id, status')
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать заявку' } },
      { status: 500 }
    );
  }

  const app = rawApp as { id: string; status: string };
  return NextResponse.json({ data: { id: app.id, status: app.status } }, { status: 201 });
}
