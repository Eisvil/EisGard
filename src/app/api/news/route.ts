import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '10')));
  const tag = searchParams.get('tag');

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('news')
    .select('slug, title, summary, cover_url, tag, published_at', { count: 'exact' })
    .eq('published', true)
    .order('published_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (tag) query = query.eq('tag', tag);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
