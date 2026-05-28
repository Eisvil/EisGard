import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { MaterialAppsManager } from '@/components/features/admin/MaterialAppsManager';

export default async function MaterialAppsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }

  return <MaterialAppsManager />;
}
