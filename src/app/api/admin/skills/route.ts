import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const createSchema = z.object({
  name: z.string().min(2).max(80),
  category: z.enum(['craft', 'building', 'farming', 'cooking', 'other', 'general']).default('general'),
  sort_order: z.number().int().min(0).default(0),
});

export async function GET() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { data, error } = await supabase
    .from('skills')
    .select('id, name, category, sort_order, created_at')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки навыков' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { data: skill, error } = await supabase
    .from('skills')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error || !skill) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось создать навык' } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { id: (skill as { id: string }).id } }, { status: 201 });
}
