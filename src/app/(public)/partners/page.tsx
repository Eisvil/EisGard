import type { Metadata } from 'next';
import Link from 'next/link';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { PartnersClient } from '@/components/features/PartnersClient';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Партнёрам — Живое Городище',
  description: 'Поддержите строительство исторического поселения ресурсами вашей организации. Партнёры упоминаются на страницах объектов.',
};

type ObjectOption = {
  id: string;
  name: string;
};

type PartnerRow = {
  id: string;
  org_name: string;
  logo_url: string | null;
  partner_website_url: string | null;
  support_type: string;
  objects: { name: string } | null;
};

const SUPPORT_LABEL: Record<string, string> = {
  money: 'Финансовая поддержка',
  materials: 'Материалы',
  services: 'Услуги',
  complex: 'Комплексная поддержка',
};

export default async function PartnersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createStaticSupabaseClient() as any;

  const [{ data: rawObjects }, { data: rawPartners }] = await Promise.all([
    supabase
      .from('objects')
      .select('id, name')
      .neq('status', 'draft')
      .order('name'),
    supabase
      .from('object_partners')
      .select('id, org_name, logo_url, partner_website_url, support_type, objects(name)')
      .order('created_at', { ascending: false }),
  ]);

  const objects = ((rawObjects ?? []) as ObjectOption[]).map((o) => ({
    id: o.id,
    name: o.name,
  }));

  const partners = (rawPartners ?? []) as unknown as PartnerRow[];

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

          {partners.length > 0 && (
            <>
              <div className="eyebrow" style={{ marginBottom: '24px' }}>
                <span />
                Наши партнёры
                <span />
              </div>
              <div className="partners-list">
                {partners.map(p => (
                  <div key={p.id} className="partner-card">
                    {p.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.logo_url} alt={p.org_name} className="partner-card-logo" />
                      : <div className="partner-card-logo-placeholder">{p.org_name[0]}</div>
                    }
                    <div className="partner-card-name">{p.org_name}</div>
                    <div className="partner-card-type">{SUPPORT_LABEL[p.support_type] ?? p.support_type}</div>
                    {p.objects?.name && (
                      <div className="partner-card-object">{p.objects.name}</div>
                    )}
                    {p.partner_website_url && (
                      <a
                        href={p.partner_website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="partner-card-link"
                      >
                        Сайт партнёра →
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: '48px' }} />
            </>
          )}

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
