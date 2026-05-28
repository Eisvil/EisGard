import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') ?? '20')));
  const eventType = searchParams.get('event_type');
  const objectId = searchParams.get('object_id');

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('chronicle_events')
    .select(
      `id, event_type, display_name, is_anonymous, amount_kopecks, points, description, created_at,
       objects:object_id ( name, slug ),
       profiles:user_id ( avatar_url )`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (eventType) query = query.eq('event_type', eventType);
  if (objectId) query = query.eq('object_id', objectId);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  const events = (data ?? []).map((e) => {
    const obj = e.objects as { name: string; slug: string } | null;
    const profile = e.profiles as { avatar_url: string | null } | null;
    return {
      id: e.id,
      event_type: e.event_type,
      display_name: (e.is_anonymous || !e.display_name) ? 'Аноним' : e.display_name,
      is_anonymous: e.is_anonymous,
      avatar_url: e.is_anonymous ? null : (profile?.avatar_url ?? null),
      object_name: obj?.name ?? null,
      object_slug: obj?.slug ?? null,
      amount_kopecks: e.amount_kopecks,
      points: e.points,
      description: e.description,
      created_at: e.created_at,
    };
  });

  return NextResponse.json({
    data: events,
    meta: { total: count ?? 0, page, per_page: perPage },
  });
}
