import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import DonationsTable from '@/components/features/admin/DonationsTable';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

export default async function AdminDonationsPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return null;
  const { supabase } = ctx;

  const [donationsResult, objectsResult] = await Promise.all([
    (supabase as unknown as AnyClient)
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
    (supabase as unknown as AnyClient)
      .from('objects')
      .select('id, name')
      .neq('status', 'draft')
      .order('name'),
  ]);

  const initialDonations = (donationsResult.data ?? []) as unknown[];
  const initialMeta = {
    total: donationsResult.count ?? 0,
    page: 1,
    per_page: 20,
  };
  const objects = ((objectsResult.data ?? []) as { id: string; name: string }[]).map(
    (o) => ({ id: o.id, name: o.name }),
  );

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Пожертвования</h1>
        <p className="text-sm text-muted-foreground mt-1">
          История донатов, фильтрация по источнику и статусу, ручное добавление
        </p>
      </div>
      <DonationsTable
        initialDonations={initialDonations as Parameters<typeof DonationsTable>[0]['initialDonations']}
        initialMeta={initialMeta}
        objects={objects}
      />
    </div>
  );
}
