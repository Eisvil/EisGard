import type { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TiptapRenderer } from '@/components/features/TiptapRenderer';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Живое Городище',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getPage() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data } = await supabase
    .from('static_pages')
    .select('title, body')
    .eq('slug', 'privacy')
    .single();
  return data as { title: string; body: Record<string, unknown> } | null;
}

export default async function PrivacyPage() {
  const page = await getPage();
  const hasContent = page?.body && Object.keys(page.body).length > 1;

  return (
    <>
      <Header />
      <main className="static-page-main">
        <div className="static-page-container">
          <div className="eyebrow">
            <span />
            Правовые документы
            <span />
          </div>

          <h1 className="static-page-title">{page?.title ?? 'Политика конфиденциальности'}</h1>

          {hasContent ? (
            <TiptapRenderer content={page!.body} className="static-page-body" />
          ) : (
            <div className="static-page-body static-page-placeholder">
              <p>Текст политики конфиденциальности будет добавлен администратором.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
