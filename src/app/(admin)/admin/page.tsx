import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function formatMoney(kopecks: number) {
  const rub = Math.floor(kopecks / 100);
  if (rub >= 1_000_000) return `${(rub / 1_000_000).toFixed(1)} млн ₽`;
  if (rub >= 1_000) return `${(rub / 1_000).toFixed(0)} тыс. ₽`;
  return `${rub} ₽`;
}

async function getStats() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;

  const [
    usersRes,
    donationsRes,
    volunteerRes,
    objectsDoneRes,
    pendingVolRes,
    pendingMatRes,
    pendingPartRes,
    objectsRes,
    slotsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('donations').select('amount_kopecks').eq('status', 'confirmed'),
    supabase.from('volunteer_applications').select('days_worked').eq('status', 'completed'),
    supabase.from('objects').select('id', { count: 'exact', head: true }).in('status', ['done', 'working']),
    supabase.from('volunteer_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('material_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('partner_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('objects').select('status'),
    supabase.from('slots').select('id', { count: 'exact', head: true }),
  ]);

  const totalRaisedKopecks = ((donationsRes.data ?? []) as Array<{ amount_kopecks: number }>)
    .reduce((sum: number, d) => sum + (d.amount_kopecks ?? 0), 0);

  const totalVolunteerDays = ((volunteerRes.data ?? []) as Array<{ days_worked: number | null }>)
    .reduce((sum: number, a) => sum + (a.days_worked ?? 0), 0);

  const objects = (objectsRes.data ?? []) as Array<{ status: string }>;
  const byStatus = objects.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: usersRes.count ?? 0,
    totalRaisedKopecks,
    totalVolunteerDays,
    objectsCompleted: objectsDoneRes.count ?? 0,
    pendingVolunteerApps: pendingVolRes.count ?? 0,
    pendingMaterialApps: pendingMatRes.count ?? 0,
    pendingPartnerApps: pendingPartRes.count ?? 0,
    objectsTotal: objects.length,
    byStatus,
    slotsTotal: slotsRes.count ?? 0,
  };
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Черновики',
  planned: 'Замысел',
  building: 'Строится',
  done: 'Завершён',
  working: 'Действует',
};

export default async function AdminDashboard() {
  const s = await getStats();

  const pendingTotal = s.pendingVolunteerApps + s.pendingMaterialApps + s.pendingPartnerApps;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Дашборд</h1>
        <p className="text-sm text-muted-foreground mt-1">Добро пожаловать в панель управления.</p>
      </div>

      {/* Главные метрики */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Участников
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{s.totalUsers.toLocaleString('ru-RU')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Собрано
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{formatMoney(s.totalRaisedKopecks)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Дней волонтёрства
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{s.totalVolunteerDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Объектов завершено
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{s.objectsCompleted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Ожидающие заявки */}
      {pendingTotal > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Требуют внимания</h2>
          <div className="flex flex-wrap gap-2">
            {s.pendingVolunteerApps > 0 && (
              <a href="/admin/applications" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors">
                Волонтёры <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{s.pendingVolunteerApps}</Badge>
              </a>
            )}
            {s.pendingMaterialApps > 0 && (
              <a href="/admin/applications" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors">
                Материалы <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{s.pendingMaterialApps}</Badge>
              </a>
            )}
            {s.pendingPartnerApps > 0 && (
              <a href="/admin/applications" className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors">
                Партнёры <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{s.pendingPartnerApps}</Badge>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Объекты по статусам */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Объектов всего
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{s.objectsTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Слотов всего
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-semibold">{s.slotsTotal}</p>
          </CardContent>
        </Card>
      </div>

      {Object.keys(s.byStatus).length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Объекты по статусам</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(s.byStatus).map(([status, count]) => (
              <span
                key={status}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs"
              >
                {STATUS_LABELS[status] ?? status}
                <span className="font-semibold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
