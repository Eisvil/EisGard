import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import ApplicationsTabs from '@/components/features/admin/ApplicationsTabs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Camp = { id: string; name: string; date_from: string; date_to: string };

export default async function ApplicationsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase, role } = ctx as { supabase: AnyClient; role: string };
  const isAdmin = role === 'admin';

  const { data: camps } = await (supabase as AnyClient)
    .from('volunteer_camps')
    .select('id, name, date_from, date_to')
    .order('date_from', { ascending: false }) as { data: Camp[] | null };

  let initialDonations: unknown[] = [];
  let initialMeta = { total: 0, page: 1, per_page: 20 };
  let objects: { id: string; name: string }[] = [];

  if (isAdmin) {
    const [donationsResult, objectsResult] = await Promise.all([
      (supabase as AnyClient)
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
        .range(0, 19),
      (supabase as AnyClient)
        .from('objects')
        .select('id, name')
        .neq('status', 'draft')
        .order('name'),
    ]);

    initialDonations = (donationsResult.data ?? []) as unknown[];
    initialMeta = {
      total: donationsResult.count ?? 0,
      page: 1,
      per_page: 20,
    };
    objects = ((objectsResult.data ?? []) as { id: string; name: string }[]).map(
      (o) => ({ id: o.id, name: o.name }),
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Заявки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Волонтёрские заявки, заявки на материалы и пожертвования
        </p>
      </div>
      <ApplicationsTabs
        camps={camps ?? []}
        isAdmin={isAdmin}
        initialDonations={initialDonations as Parameters<typeof ApplicationsTabs>[0]['initialDonations']}
        initialMeta={initialMeta}
        objects={objects}
      />
    </div>
  );
}
