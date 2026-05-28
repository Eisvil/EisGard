import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { NextResponse } from 'next/server';
import { Button } from '@/components/ui/button';
import { NewsTable } from '@/components/features/admin/NewsTable';

export default async function AdminNewsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) return null;
  const { supabase } = ctx;

  const { data: news } = await supabase
    .from('news')
    .select('id, slug, title, summary, cover_url, tag, published, published_at, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Новости</h1>
        <Button asChild>
          <Link href="/admin/news/new">+ Создать новость</Link>
        </Button>
      </div>
      <NewsTable rows={news ?? []} />
    </div>
  );
}
