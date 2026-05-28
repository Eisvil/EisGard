import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { NextResponse } from 'next/server';
import { NewsForm } from '@/components/features/admin/NewsForm';

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminNewsEditPage({ params }: PageProps) {
  const { id } = await params;

  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return null;
  const { supabase } = ctx;

  const { data: news } = await supabase
    .from('news')
    .select('id, slug, title, summary, body, cover_url, tag, published, published_at')
    .eq('id', id)
    .single() as { data: {
      id: string; slug: string; title: string; summary: string | null;
      body: Record<string, unknown>; cover_url: string | null; tag: string | null;
      published: boolean; published_at: string | null;
    } | null };

  if (!news) notFound();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/news" className="text-sm text-muted-foreground hover:text-foreground">
          ← Назад к новостям
        </Link>
        <h1 className="text-2xl font-bold">Редактирование: {news.title}</h1>
      </div>
      <NewsForm mode="edit" initialData={news} />
    </div>
  );
}
