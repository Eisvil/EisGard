import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Params = { id: string };

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;

  const authResult = await requireAdmin(['admin', 'moderator']);
  if (authResult instanceof Response) return authResult;
  const { userId: adminId } = authResult;

  const supabase = (await createServerSupabaseClient()) as AnyClient;

  const { data: comment } = await supabase
    .from('object_comments')
    .select('id, is_deleted')
    .eq('id', id)
    .maybeSingle() as { data: { id: string; is_deleted: boolean } | null };

  if (!comment) {
    return NextResponse.json({ error: { code: 'NOT_FOUND' } }, { status: 404 });
  }

  if (comment.is_deleted) {
    return NextResponse.json({ data: { deleted: true } });
  }

  const { error } = await supabase
    .from('object_comments')
    .update({ is_deleted: true, deleted_by: adminId })
    .eq('id', id) as { error: unknown };

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR' } }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
