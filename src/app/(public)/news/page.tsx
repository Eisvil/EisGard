import type { Metadata } from 'next';
import Link from 'next/link';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Новости — Живое Городище',
  description: 'Последние новости о строительстве историческое поселения на Псковской земле.',
};

type NewsItem = {
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  tag: string | null;
  published_at: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default async function NewsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createStaticSupabaseClient() as any;

  const { data } = await supabase
    .from('news')
    .select('slug, title, summary, cover_url, tag, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  const news = (data ?? []) as NewsItem[];

  return (
    <>
      <Header />
      <main>
        <div className="public-page-layout">
          <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
            <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
          </nav>

          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--olive-dark)', marginBottom: '8px' }}>
            Новости городища
          </h1>
          <p style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', marginBottom: '32px', maxWidth: '640px' }}>
            {news.length > 0
              ? `${news.length} ${pluralNews(news.length)} о строительстве поселения`
              : 'Следите за обновлениями — новости скоро появятся'}
          </p>

          {news.length === 0 ? (
            <p className="news-list-empty">Новостей пока нет — следите за обновлениями</p>
          ) : (
            <div className="news-list-grid">
              {news.map((n) => (
                <Link key={n.slug} href={`/news/${n.slug}`} className="news-list-card">
                  {n.cover_url ? (
                    <img src={n.cover_url} alt={n.title} className="news-list-card-img" />
                  ) : (
                    <div className="news-list-card-placeholder" />
                  )}
                  <div className="news-list-card-body">
                    <div className="news-list-card-meta">
                      {n.published_at && <time>{formatDate(n.published_at)}</time>}
                      {n.tag && <span className="news-list-card-tag">{n.tag.toUpperCase()}</span>}
                    </div>
                    <h3>{n.title}</h3>
                    {n.summary && <p>{n.summary}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function pluralNews(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'новость';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'новости';
  return 'новостей';
}
