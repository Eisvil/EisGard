import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { MapSection } from '@/components/features/MapSection';
import type { ChronicleEvent, NewsItem, SiteStats, NpcSettings } from '@/components/features/MapSection';

export const revalidate = 300;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function HomePage() {
  const supabase = createStaticSupabaseClient() as AnyClient;

  const [
    { data: objects },
    { data: chronicleRaw },
    { data: newsRaw },
    { count: totalUsers },
    { data: donationsRaw },
    { data: volunteerDaysData },
    { count: objectsDone },
    { data: npcSettingsRaw },
  ] = await Promise.all([
    supabase
      .from('objects')
      .select('id, slug, name, short_name, zone, status, description, cover_url, icon_key, map_position_x, map_position_y, total_goal_rub, total_raised_rub')
      .order('sort_order'),
    supabase
      .from('chronicle_events')
      .select('id, event_type, display_name, is_anonymous, amount_kopecks, points, description, created_at, objects:object_id ( name, slug ), profiles:user_id ( avatar_url )')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('news')
      .select('slug, title, summary, cover_url, tag, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(5),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('donations').select('amount_kopecks').eq('status', 'confirmed'),
    // RPC обходит RLS (anon-клиент не видит volunteer_applications напрямую)
    supabase.rpc('get_volunteer_days_total'),
    supabase.from('objects').select('id', { count: 'exact', head: true }).in('status', ['done', 'working']),
    supabase.from('settings').select('key, value').in('key', ['npc_name','npc_position_x','npc_position_y','npc_portrait_url']),
  ]);

  const siteStats: SiteStats = {
    users:          totalUsers ?? 0,
    raised_kopecks: (donationsRaw ?? []).reduce((s: number, d: { amount_kopecks: number }) => s + (d.amount_kopecks ?? 0), 0),
    volunteer_days: (volunteerDaysData as number | null) ?? 0,
    objects_done:   objectsDone ?? 0,
  };

  const chronicle: ChronicleEvent[] = (chronicleRaw ?? []).map((e: Record<string, unknown>) => {
    const obj = e.objects as { name: string; slug: string } | null;
    const profile = e.profiles as { avatar_url: string | null } | null;
    return {
      id:            e.id as string,
      event_type:    e.event_type as string,
      display_name:  (e.is_anonymous || !e.display_name) ? 'Аноним' : e.display_name as string,
      is_anonymous:  e.is_anonymous as boolean,
      avatar_url:    e.is_anonymous ? null : (profile?.avatar_url ?? null),
      object_name:   obj?.name ?? null,
      object_slug:   obj?.slug ?? null,
      amount_kopecks:e.amount_kopecks as number | null,
      points:        e.points as number | null,
      description:   e.description as string | null,
      created_at:    (e.created_at as string) ?? new Date().toISOString(),
    };
  });

  const news: NewsItem[] = (newsRaw ?? []) as NewsItem[];

  const npcMap: Record<string, unknown> = Object.fromEntries(
    (npcSettingsRaw ?? []).map((r: { key: string; value: unknown }) => [r.key, r.value])
  );
  const npcSettings: NpcSettings | undefined = npcMap.npc_position_x != null ? {
    name:         String(npcMap.npc_name ?? 'Ведун'),
    position_x:   Number(npcMap.npc_position_x ?? 50),
    position_y:   Number(npcMap.npc_position_y ?? 50),
    portrait_url: String(npcMap.npc_portrait_url ?? ''),
  } : undefined;

  return (
    <>
      <div className="paper-glow" aria-hidden="true"></div>
      <Header />
      <main className="dashboard">
        <MapSection
          objects={objects ?? []}
          initialChronicle={chronicle}
          newsItems={news}
          siteStats={siteStats}
          npcSettings={npcSettings}
        />
      </main>
      <Footer />
    </>
  );
}
