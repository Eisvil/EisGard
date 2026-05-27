import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { PartnersClient } from '@/components/features/PartnersClient';

type ObjectRow = {
  id: string;
  name: string;
};

export default async function PartnersPage() {
  const supabase = await createServerSupabaseClient();

  const { data: rawObjects } = await supabase
    .from('objects')
    .select('id, name')
    .neq('status', 'draft')
    .order('name');

  const objects = ((rawObjects ?? []) as ObjectRow[]).map((o) => ({
    id: o.id,
    name: o.name,
  }));

  return (
    <>
      <Header />
      <main>
        <div className="partners-page">
          <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
            <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
          </nav>

          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--olive-dark)', marginBottom: '8px' }}>
            Партнёрам
          </h1>
          <p style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', marginBottom: '32px', maxWidth: '640px' }}>
            Поддержите строительство исторического поселения X–XIII вв. ресурсами, услугами или
            финансированием. Партнёры проекта упоминаются на страницах объектов, которые они поддерживают,
            а при желании — на странице «О проекте». Авторизация не требуется.
          </p>

          <div className="eyebrow" style={{ marginBottom: '32px' }}>
            <span />
            Стать партнёром
            <span />
          </div>

          <PartnersClient objects={objects} />
        </div>
      </main>
      <Footer />
    </>
  );
}
