import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { VolunteersClient } from '@/components/features/VolunteersClient';

type CampRow = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  max_volunteers: number;
  description: string | null;
  is_open: boolean;
};

type AppRow = {
  camp_id: string;
};

type SkillRow = {
  id: string;
  name: string;
  category: string;
};

function formatDateRange(from: string, to: string): string {
  const f = new Date(from);
  const t = new Date(to);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  if (f.getFullYear() !== t.getFullYear()) {
    return `${f.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' })} — ${t.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' })}`;
  }
  if (f.getMonth() !== t.getMonth()) {
    return `${f.toLocaleDateString('ru-RU', opts)} — ${t.toLocaleDateString('ru-RU', opts)} ${t.getFullYear()}`;
  }
  return `${f.getDate()}–${t.getDate()} ${t.toLocaleDateString('ru-RU', { month: 'long' })} ${t.getFullYear()}`;
}

export default async function VolunteersPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: { user } },
    { data: rawCamps },
    { data: rawSkills },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('volunteer_camps')
      .select('id, name, date_from, date_to, max_volunteers, description, is_open')
      .order('date_from', { ascending: true }),
    supabase
      .from('skills')
      .select('id, name, category')
      .order('sort_order'),
  ]);

  const camps = (rawCamps ?? []) as CampRow[];
  const skills = (rawSkills ?? []) as SkillRow[];

  let profileName: string | undefined;
  if (user) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle() as { data: { full_name: string } | null };
    profileName = prof?.full_name ?? undefined;
  }

  // Compute spots_left for each camp
  const campIds = camps.map((c) => c.id);
  let countMap: Record<string, number> = {};
  if (campIds.length > 0) {
    const { data: rawApps } = await supabase
      .from('volunteer_applications')
      .select('camp_id')
      .in('camp_id', campIds)
      .in('status', ['pending', 'approved']);
    for (const row of (rawApps ?? []) as AppRow[]) {
      countMap[row.camp_id] = (countMap[row.camp_id] ?? 0) + 1;
    }
  }

  const campsWithSpots = camps.map((camp) => ({
    ...camp,
    spots_left: Math.max(0, camp.max_volunteers - (countMap[camp.id] ?? 0)),
    date_range: formatDateRange(camp.date_from, camp.date_to),
  }));

  return (
    <>
      <Header />
      <main>
    <div className="volunteers-page">
      <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
        <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
      </nav>

      <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--olive-dark)', marginBottom: '8px' }}>
        Волонтёрам
      </h1>
      <p style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', marginBottom: '32px', maxWidth: '640px' }}>
        Приезжайте работать руками: строить, ковать, гончарить, плотничать.
        Каждый заезд — 4–5 дней погружения в жизнь средневекового городища.
        Участие бесплатно, баллы начисляются за каждый отработанный день.
      </p>

      <div className="eyebrow" style={{ marginBottom: '24px' }}>
        <span />
        Ближайшие заезды
        <span />
      </div>

      {campsWithSpots.length === 0 ? (
        <p style={{ color: 'var(--olive-soft)', fontFamily: 'var(--sans)' }}>Заездов пока нет. Следите за обновлениями.</p>
      ) : (
        <VolunteersClient
          camps={campsWithSpots}
          skills={skills}
          isLoggedIn={!!user}
          defaultName={profileName}
        />
      )}
    </div>
      </main>
      <Footer />
    </>
  );
}
