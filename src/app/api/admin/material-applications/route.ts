import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET(request: Request) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'all';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') ?? '20', 10));
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('material_applications')
    .select(
      'id, quantity, actual_qty, contact_phone, contact_telegram, comment, ' +
        'status, points_awarded, admin_note, created_at, ' +
        'profiles(full_name), ' +
        'materials(name, unit), ' +
        'objects(name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') query = query.eq('status', status);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки заявок' } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
