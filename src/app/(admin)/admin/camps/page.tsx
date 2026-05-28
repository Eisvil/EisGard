import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import CampsManager, { type Camp } from '@/components/features/admin/CampsManager';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;
type AppRow = { camp_id: string; status: string };
type CampRow = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  max_volunteers: number;
  description: string | null;
  is_open: boolean;
  created_at: string | null;
};

export default async function AdminCampsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return null;
  const { supabase } = ctx;

  const { data: rawCamps } = await (supabase as unknown as AnyClient)
    .from('volunteer_camps')
    .select('id, name, date_from, date_to, max_volunteers, description, is_open, created_at')
    .order('date_from', { ascending: false });

  const camps = (rawCamps ?? []) as CampRow[];
  const campIds = camps.map((c) => c.id);

  let pendingMap: Record<string, number> = {};
  let approvedMap: Record<string, number> = {};

  if (campIds.length > 0) {
    const { data: rawApps } = await (supabase as unknown as AnyClient)
      .from('volunteer_applications')
      .select('camp_id, status')
      .in('camp_id', campIds)
      .in('status', ['pending', 'approved']);

    for (const a of (rawApps ?? []) as AppRow[]) {
      if (a.status === 'pending') pendingMap[a.camp_id] = (pendingMap[a.camp_id] ?? 0) + 1;
      if (a.status === 'approved') approvedMap[a.camp_id] = (approvedMap[a.camp_id] ?? 0) + 1;
    }
  }

  const initialCamps: Camp[] = camps.map((c) => ({
    ...c,
    pending_count: pendingMap[c.id] ?? 0,
    approved_count: approvedMap[c.id] ?? 0,
  }));

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Волонтёрские заезды</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управление заездами, датами и набором участников
        </p>
      </div>
      <CampsManager initialCamps={initialCamps} />
    </div>
  );
}
