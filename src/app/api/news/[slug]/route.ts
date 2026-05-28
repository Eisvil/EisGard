import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const preview = request.nextUrl.searchParams.get('preview') === 'true';

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('news')
    .select('id, slug, title, summary, body, cover_url, tag, published, published_at, created_at')
    .eq('slug', slug);

  if (preview) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'admin' || profile?.role === 'moderator') {
        // Allow unpublished for admin/moderator
      } else {
        query = query.eq('published', true);
      }
    } else {
      query = query.eq('published', true);
    }
  } else {
    query = query.eq('published', true);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Новость не найдена' } }, { status: 404 });
  }

  return NextResponse.json({ data });
}
