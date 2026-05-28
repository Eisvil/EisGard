import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET(request: Request) {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = 20;

  let query = supabase
    .from('partner_applications')
    .select(
      'id, org_name, inn, support_type, description, contact_name, contact_email, contact_phone, status, logo_url, admin_note, created_at, objects(name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (status) query = query.eq('status', status);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
