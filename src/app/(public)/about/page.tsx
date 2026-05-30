import type { Metadata } from 'next';
import Link from 'next/link';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { TiptapRenderer } from '@/components/features/TiptapRenderer';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'О проекте — Живое Городище',
  description: 'История и цели проекта по воссозданию аутентичного славянского поселения X–XIII вв.',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getPage() {
  const supabase = createStaticSupabaseClient() as AnyClient;
  const { data } = await supabase
    .from('static_pages')
    .select('title, body')
    .eq('slug', 'about')
    .single();
  return data as { title: string; body: Record<string, unknown> } | null;
}

export default async function AboutPage() {
  const page = await getPage();
  const hasContent = page?.body && Object.keys(page.body).length > 1;

  return (
    <>
      <Header />
      <main className="static-page-main">
      <div className="static-page-container">
        <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>

        <h1 className="static-page-title">{page?.title ?? 'О проекте'}</h1>

        {hasContent ? (
          <TiptapRenderer content={page!.body} className="static-page-body" />
        ) : (
          <div className="static-page-body static-page-placeholder">
            <p>
              «Живое Городище» — платформа коллективного строительства аутентичного
              славянского поселения X–XIII вв. на Псковской земле.
            </p>
            <p>
              Здесь каждый может стать частью живой истории: пожертвовать деньги,
              материалы, труд или партнёрский ресурс в конкретные объекты и получить
              накапливаемый статус в летописи проекта.
            </p>
            <p>
              Контент этой страницы будет добавлен администратором.
            </p>
          </div>
        )}

      </div>
    </main>
    <Footer />
    </>
  );
}
