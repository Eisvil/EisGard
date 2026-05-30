import type { Metadata } from 'next';
import Link from 'next/link';
import { createStaticSupabaseClient } from '@/lib/supabase/static';
import { TiptapRenderer } from '@/components/features/TiptapRenderer';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Обработка персональных данных — Живое Городище',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getPage() {
  const supabase = createStaticSupabaseClient() as AnyClient;
  const { data } = await supabase
    .from('static_pages')
    .select('title, body')
    .eq('slug', 'personal-data')
    .single();
  return data as { title: string; body: Record<string, unknown> } | null;
}

export default async function PersonalDataPage() {
  const page = await getPage();
  const hasContent = page?.body && Object.keys(page.body).length > 1;

  return (
    <>
      <Header />
      <main className="static-page-main">
        <div className="static-page-container">
          <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>

          <h1 className="static-page-title">{page?.title ?? 'Обработка персональных данных'}</h1>

          {hasContent ? (
            <TiptapRenderer content={page!.body} className="static-page-body" />
          ) : (
            <div className="static-page-body static-page-placeholder">
              <p>Текст об обработке персональных данных будет добавлен администратором.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
