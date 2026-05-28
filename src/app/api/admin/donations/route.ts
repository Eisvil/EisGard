import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

export async function GET(request: Request) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '20', 10)));
  const statusFilter = searchParams.get('status');
  const sourceFilter = searchParams.get('source');
  const objectIdFilter = searchParams.get('object_id');

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = (supabase as unknown as AnyClient)
    .from('donations')
    .select(
      `id, amount_kopecks, display_name, is_anonymous, source, status,
       points_awarded, confirmed_at, created_at,
       profiles(full_name, avatar_url),
       objects(name, slug),
       slots(name)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (statusFilter) query = query.eq('status', statusFilter);
  if (sourceFilter) query = query.eq('source', sourceFilter);
  if (objectIdFilter) query = query.eq('object_id', objectIdFilter);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки пожертвований' } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
