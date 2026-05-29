import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { ChronicleList } from '@/components/features/ChronicleList';
import type { ChronicleEvent } from '@/components/features/MapSection';

export const revalidate = 60;

export const metadata = {
  title: 'Летопись — Живое Городище',
  description: 'Хроника событий: пожертвования, волонтёрство, материальная помощь участников проекта.',
};

export default async function ChroniclePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createStaticSupabaseClient() as any;

  const { data: raw, count } = await supabase
    .from('chronicle_events')
    .select(
      'id, event_type, display_name, is_anonymous, amount_kopecks, points, description, created_at, objects:object_id ( name, slug ), profiles:user_id ( avatar_url )',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData: ChronicleEvent[] = (raw ?? []).map((e: any) => {
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
      created_at: e.created_at ?? new Date().toISOString(),
    };
  });

  return (
    <>
      <Header />
      <main className="site-page">
        <div className="site-page-inner">
          <h1 className="site-page-title">Летопись городища</h1>
          <p className="site-page-subtitle">
            Живая история проекта — вклады участников в хронологическом порядке.
          </p>
          <ChronicleList initialData={initialData} initialTotal={count ?? 0} />
        </div>
      </main>
      <Footer />
    </>
  );
}
