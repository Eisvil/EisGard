import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { buildQuickpayUrl } from '@/lib/payments/ymoney';

const schema = z.object({
  object_id: z.string().uuid(),
  slot_id: z.string().uuid().optional(),
  amount_kopecks: z.number().int().min(10000, 'Минимальная сумма 100 ₽'),
  display_name: z.string().min(2).max(120),
  is_anonymous: z.boolean(),
  object_slug: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

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

  const { object_id, slot_id, amount_kopecks, display_name, is_anonymous, object_slug } = parsed.data;

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  const userId: string | null = user?.id ?? null;

  const { data: object } = await supabase
    .from('objects')
    .select('id, name, status')
    .eq('id', object_id)
    .neq('status', 'draft')
    .maybeSingle() as { data: { id: string; name: string; status: string } | null };

  if (!object) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Объект не найден' } },
      { status: 404 }
    );
  }

  const { data: donation, error } = await supabase
    .from('donations')
    .insert({
      user_id: userId,
      object_id,
      slot_id: slot_id ?? null,
      amount_kopecks,
      display_name,
      is_anonymous,
      source: 'ymoney',
      status: 'pending',
    })
    .select('id')
    .single() as { data: { id: string } | null; error: unknown };

  if (error || !donation) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать пожертвование' } },
      { status: 500 }
    );
  }

  const wallet = process.env.YMONEY_WALLET;
  if (!wallet) {
    return NextResponse.json(
      { error: { code: 'CONFIG_ERROR', message: 'Платёжный сервис не настроен' } },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const redirect_url = buildQuickpayUrl({
    wallet,
    sum: amount_kopecks / 100,
    label: donation.id,
    targets: object.name,
    successURL: `${siteUrl}/objects/${object_slug}?donated=true`,
  });

  return NextResponse.json({ data: { donation_id: donation.id, redirect_url } }, { status: 201 });
}
