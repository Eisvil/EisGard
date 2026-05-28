import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { recalcAllTitles } from '@/lib/points/recalcAllTitles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  min_points: z.number().int().min(0).optional(),
  description: z.string().max(500).optional(),
  privileges: z.string().max(500).optional(),
  sort_order: z.number().int().min(0).optional(),
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

  const updates = parsed.data;
  const minPointsChanged = updates.min_points !== undefined;

  const { error } = await supabase.from('titles').update(updates).eq('id', id);

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось обновить титул' } },
      { status: 500 },
    );
  }

  if (minPointsChanged) {
    await recalcAllTitles();
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

  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('title_id', id) as { count: number | null };

  if (count && count > 0) {
    return NextResponse.json(
      { error: { code: 'TITLE_IN_USE', message: `Назначен ${count} участникам`, count } },
      { status: 400 },
    );
  }

  await supabase.from('titles').delete().eq('id', id);

  return NextResponse.json({ data: { deleted: true } });
}
