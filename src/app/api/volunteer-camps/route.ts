import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type CampRow = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  max_volunteers: number;
  description: string | null;
  is_open: boolean;
};

type AppCountRow = {
  camp_id: string;
  count: string;
};

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: rawCamps, error } = await supabase
    .from('volunteer_camps')
    .select('id, name, date_from, date_to, max_volunteers, description, is_open')
    .order('date_from', { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось загрузить заезды' } },
      { status: 500 }
    );
  }

  const camps = (rawCamps ?? []) as CampRow[];
  if (camps.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const campIds = camps.map((c) => c.id);

  // Count pending + approved applications per camp to compute spots_left
  const { data: rawCounts } = await supabase
    .from('volunteer_applications')
    .select('camp_id')
    .in('camp_id', campIds)
    .in('status', ['pending', 'approved']);

  const countMap: Record<string, number> = {};
  for (const row of (rawCounts ?? []) as AppCountRow[]) {
    countMap[row.camp_id] = (countMap[row.camp_id] ?? 0) + 1;
  }

  const data = camps.map((camp) => {
    const taken = countMap[camp.id] ?? 0;
    return {
      id: camp.id,
      name: camp.name,
      date_from: camp.date_from,
      date_to: camp.date_to,
      max_volunteers: camp.max_volunteers,
      spots_left: Math.max(0, camp.max_volunteers - taken),
      description: camp.description,
      is_open: camp.is_open,
    };
  });

  return NextResponse.json({ data });
}
