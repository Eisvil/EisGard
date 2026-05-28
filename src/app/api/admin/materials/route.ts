import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET(request: Request) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { searchParams } = new URL(request.url);
  const withApps = searchParams.get('with_apps') === 'true';

  let query = supabase
    .from('materials')
    .select(
      withApps
        ? 'id, name, description, unit, needed_qty, received_qty, is_active, sort_order, created_at, objects(name), material_applications(id, status)'
        : 'id, name, description, unit, needed_qty, received_qty, is_active, sort_order, created_at, objects(name)',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  // Считаем pending заявки если нужно
  const result = withApps
    ? (data ?? []).map((m: Record<string, unknown> & { material_applications?: Array<{ status: string }> }) => {
        const apps = (m.material_applications ?? []) as Array<{ status: string }>;
        const { material_applications, ...rest } = m;
        void material_applications;
        return {
          ...rest,
          pending_apps_count: apps.filter((a) => a.status === 'pending').length,
        };
      })
    : data ?? [];

  return NextResponse.json({ data: result });
}

const postSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  unit: z.string().min(1).max(20).default('шт'),
  needed_qty: z.number().positive(),
  object_id: z.string().uuid().optional(),
  sort_order: z.number().int().default(0),
});

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

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' } },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('materials')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
