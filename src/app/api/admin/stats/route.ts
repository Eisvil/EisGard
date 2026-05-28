import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function GET() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;
  const { supabase } = ctx as { supabase: AnyClient };

  const [
    usersRes,
    donationsRes,
    volunteerHoursRes,
    objectsDoneRes,
    pendingVolunteersRes,
    pendingMaterialsRes,
    pendingPartnersRes,
  ] = await Promise.all([
    // Всего участников
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    // Сумма подтверждённых пожертвований
    supabase
      .from('donations')
      .select('amount_kopecks')
      .eq('status', 'confirmed'),
    // Волонтёрские дни (completed)
    supabase
      .from('volunteer_applications')
      .select('days_worked')
      .eq('status', 'completed'),
    // Завершённых/действующих объектов
    supabase
      .from('objects')
      .select('id', { count: 'exact', head: true })
      .in('status', ['done', 'working']),
    // Ожидающих волонтёрских заявок
    supabase
      .from('volunteer_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // Ожидающих заявок на материалы
    supabase
      .from('material_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // Ожидающих партнёрских заявок
    supabase
      .from('partner_applications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const totalRaisedKopecks = ((donationsRes.data ?? []) as Array<{ amount_kopecks: number }>)
    .reduce((sum: number, d) => sum + (d.amount_kopecks ?? 0), 0);

  const totalVolunteerDays = ((volunteerHoursRes.data ?? []) as Array<{ days_worked: number | null }>)
    .reduce((sum: number, a) => sum + (a.days_worked ?? 0), 0);

  return NextResponse.json({
    data: {
      total_users: usersRes.count ?? 0,
      total_raised_kopecks: totalRaisedKopecks,
      total_volunteer_days: totalVolunteerDays,
      objects_completed: objectsDoneRes.count ?? 0,
      pending_volunteer_apps: pendingVolunteersRes.count ?? 0,
      pending_material_apps: pendingMaterialsRes.count ?? 0,
      pending_partner_apps: pendingPartnersRes.count ?? 0,
    },
  });
}
