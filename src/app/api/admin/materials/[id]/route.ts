import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  unit: z.string().min(1).max(20).optional(),
  needed_qty: z.number().positive().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  object_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;

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

  const { error } = await supabase
    .from('materials')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { updated: true } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;

  // Проверяем незакрытые заявки
  const { count } = await supabase
    .from('material_applications')
    .select('id', { count: 'exact', head: true })
    .eq('material_id', id)
    .in('status', ['pending', 'contacted']) as { count: number | null };

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: { code: 'HAS_PENDING_APPS', message: 'Есть незакрытые заявки на этот материал' } },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('materials').delete().eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { deleted: true } });
}
