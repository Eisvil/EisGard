import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return ctx;

  const { supabase } = ctx;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [viewsTotalRes, views7dRes, donationsRes] = await Promise.all([
    supabase
      .from('object_views')
      .select('id', { count: 'exact', head: true })
      .eq('object_id', id) as Promise<{ count: number | null; error: unknown }>,

    supabase
      .from('object_views')
      .select('id', { count: 'exact', head: true })
      .eq('object_id', id)
      .gte('viewed_at', sevenDaysAgoStr) as Promise<{ count: number | null; error: unknown }>,

    supabase
      .from('donations')
      .select('amount_kopecks')
      .eq('object_id', id)
      .eq('status', 'confirmed') as Promise<{ data: Array<{ amount_kopecks: number }> | null; error: unknown }>,
  ]);

  const viewsTotal = viewsTotalRes.count ?? 0;
  const views7d = views7dRes.count ?? 0;
  const donations = donationsRes.data ?? [];
  const donationsCount = donations.length;
  const donationsSumKopecks = donations.reduce((sum, d) => sum + (d.amount_kopecks ?? 0), 0);
  const avgDonationKopecks = donationsCount > 0 ? Math.round(donationsSumKopecks / donationsCount) : 0;

  const response = NextResponse.json({
    data: {
      views_total:           viewsTotal,
      views_7d:              views7d,
      donations_count:       donationsCount,
      donations_sum_kopecks: donationsSumKopecks,
      avg_donation_kopecks:  avgDonationKopecks,
    },
  });

  response.headers.set('Cache-Control', 'max-age=600');
  return response;
}
