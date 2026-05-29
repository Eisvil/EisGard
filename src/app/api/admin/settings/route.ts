import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const ALLOWED_KEYS = [
  'points_per_ruble', 'points_per_day',
  'social_vk', 'social_telegram', 'social_youtube',
  'social_vk_icon', 'social_telegram_icon', 'social_youtube_icon',
] as const;

const patchSchema = z.object({
  points_per_ruble: z.number().int().min(0).optional(),
  points_per_day: z.number().int().min(0).optional(),
  social_vk: z.string().optional(),
  social_telegram: z.string().optional(),
  social_youtube: z.string().optional(),
  social_vk_icon: z.string().optional(),
  social_telegram_icon: z.string().optional(),
  social_youtube_icon: z.string().optional(),
});

export async function GET() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ALLOWED_KEYS);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки настроек' } },
      { status: 500 },
    );
  }

  const settings: Record<string, number> = {};
  for (const row of (data ?? []) as { key: string; value: unknown }[]) {
    settings[row.key] = Number(row.value);
  }

  return NextResponse.json({ data: settings });
}

export async function PATCH(request: Request) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

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

  const updates = parsed.data;
  const updated: string[] = [];

  for (const key of ALLOWED_KEYS) {
    if (updates[key] !== undefined) {
      await supabase
        .from('settings')
        .upsert({ key, value: updates[key] }, { onConflict: 'key' });
      updated.push(key);
    }
  }

  return NextResponse.json({ data: { updated } });
}
