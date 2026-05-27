import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { MapSection } from '@/components/features/MapSection';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: objects } = await supabase
    .from('objects')
    .select(
      'id, slug, name, short_name, zone, status, description, cover_url, icon_key, map_position_x, map_position_y, total_goal_rub, total_raised_rub'
    )
    .order('sort_order');

  return (
    <>
      <div className="paper-glow" aria-hidden="true"></div>
      <Header />
      <main className="dashboard">
        <MapSection objects={objects ?? []} />
      </main>
      <Footer />
    </>
  );
}
