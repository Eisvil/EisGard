import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { PartnerAppsManager } from '@/components/features/admin/PartnerAppsManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function PartnerApplicationsPage() {
  const ctx = await requireAdmin(['admin', 'moderator']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const { data: apps } = await (supabase as AnyClient)
    .from('partner_applications')
    .select('id, org_name, inn, support_type, description, contact_name, contact_email, contact_phone, status, logo_url, admin_note, created_at, objects(name)')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Партнёрские заявки</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Заявки от организаций на партнёрское сотрудничество
        </p>
      </div>
      <PartnerAppsManager initialApps={apps ?? []} />
    </div>
  );
}
