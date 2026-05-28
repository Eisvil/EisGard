import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;

  const { count } = await supabase
    .from('user_skills')
    .select('skill_id', { count: 'exact', head: true })
    .eq('skill_id', id) as { count: number | null };

  if (count && count > 0) {
    return NextResponse.json(
      { error: { code: 'SKILL_IN_USE', message: `Выбран у ${count} участников`, count } },
      { status: 400 },
    );
  }

  await supabase.from('skills').delete().eq('id', id);

  return NextResponse.json({ data: { deleted: true } });
}
