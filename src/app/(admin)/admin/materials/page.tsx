import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { MaterialsManager } from '@/components/features/admin/MaterialsManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function AdminMaterialsPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const { data: objects } = await (supabase as AnyClient)
    .from('objects')
    .select('id, name')
    .neq('status', 'draft')
    .order('name') as { data: { id: string; name: string }[] | null };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Справочник материалов</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управление списком нужных материалов, видимых на публичной странице
        </p>
      </div>
      <MaterialsManager objects={objects ?? []} />
    </div>
  );
}
