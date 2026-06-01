import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/requireAdmin';

const PatchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  text: z.string().min(5).max(1000).optional(),
}).refine((d) => d.title !== undefined || d.text !== undefined, {
  message: 'Укажите title или text',
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { id } = await params;
  const body = await req.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('tutorial_steps')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({ data: { updated: true } });
}
