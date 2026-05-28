import Link from 'next/link';
import { NewsForm } from '@/components/features/admin/NewsForm';

export default function AdminNewsNewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/news" className="text-sm text-muted-foreground hover:text-foreground">
          ← Назад к новостям
        </Link>
        <h1 className="text-2xl font-bold">Новая новость</h1>
      </div>
      <NewsForm mode="create" />
    </div>
  );
}
