import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { TiptapRenderer } from '@/components/features/TiptapRenderer';

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: Record<string, unknown>;
  cover_url: string | null;
  tag: string | null;
  published: boolean;
  published_at: string | null;
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateStaticParams() {
  const supabase = createStaticSupabaseClient();
  const { data } = await supabase
    .from('news')
    .select('slug')
    .eq('published', true);
  return (data ?? []).map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('news')
    .select('title, summary')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  if (!data) return { title: 'Новость не найдена' };
  return {
    title: `${data.title} — Живое Городище`,
    description: data.summary ?? undefined,
  };
}

export default async function NewsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === 'true';

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('news')
    .select('id, slug, title, summary, body, cover_url, tag, published, published_at')
    .eq('slug', slug);

  if (isPreview) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profile || !['admin', 'moderator'].includes(profile.role)) {
        query = query.eq('published', true);
      }
    } else {
      query = query.eq('published', true);
    }
  } else {
    query = query.eq('published', true);
  }

  const { data: news } = await query.single() as { data: NewsRow | null };

  if (!news) notFound();

  const publishedDate = news.published_at
    ? new Date(news.published_at).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <>
      <Header />
      <main className="site-page">
        {news.cover_url && (
          <div className="news-hero">
            <img src={news.cover_url} alt={news.title} className="news-hero-img" />
            <div className="news-hero-overlay" />
          </div>
        )}
        <div className="news-detail">
          <div className="news-meta">
            {news.tag && <span className="news-tag-badge">{news.tag.toUpperCase()}</span>}
            {publishedDate && <time className="news-date">{publishedDate}</time>}
          </div>
          <h1 className="news-title">{news.title}</h1>
          {news.summary && <p className="news-summary">{news.summary}</p>}
          <TiptapRenderer content={news.body} />
          <div className="news-nav">
            <a href="/" className="text-link">← На главную</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
