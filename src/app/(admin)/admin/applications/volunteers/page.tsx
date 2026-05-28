import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { VolunteerAppsManager } from '@/components/features/admin/VolunteerAppsManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Camp = { id: string; name: string; date_from: string; date_to: string };

export default async function VolunteerAppsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const { data: camps } = await supabase
    .from('volunteer_camps')
    .select('id, name, date_from, date_to')
    .order('date_from', { ascending: false }) as { data: Camp[] | null };

  return <VolunteerAppsManager initialCamps={camps ?? []} />;
}
