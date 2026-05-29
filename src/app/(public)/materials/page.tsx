import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { MaterialsClient } from '@/components/features/MaterialsClient';

export const revalidate = 1800;

type MaterialRow = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  needed_qty: number | null;
  received_qty: number;
  is_active: boolean;
  sort_order: number;
  object_id: string | null;
  objects: { name: string; slug: string } | null;
};

export default async function MaterialsPage() {
  const supabase = await createServerSupabaseClient();

  const [
    { data: { user } },
    { data: rawMaterials },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('materials')
      .select('id, name, description, unit, needed_qty, received_qty, is_active, sort_order, object_id, objects(name, slug)')
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  const materials = ((rawMaterials ?? []) as MaterialRow[]).map((m) => {
    const percent =
      m.needed_qty && m.needed_qty > 0
        ? Math.min(100, Math.round((m.received_qty / m.needed_qty) * 100))
        : 0;

    return {
      id: m.id,
      name: m.name,
      unit: m.unit,
      needed_qty: m.needed_qty,
      received_qty: m.received_qty,
      percent,
      object_name: m.objects?.name ?? null,
      object_slug: m.objects?.slug ?? null,
    };
  });

  return (
    <>
      <Header />
      <main>
        <div className="materials-page">
          <nav style={{ marginBottom: '16px', fontSize: '14px', fontFamily: 'var(--sans)', color: 'var(--olive-soft)' }}>
            <Link href="/" className="text-link" style={{ fontSize: '14px' }}>← На главную</Link>
          </nav>

          <h1 style={{ fontFamily: 'var(--serif)', color: 'var(--olive-dark)', marginBottom: '8px' }}>
            Материалы
          </h1>
          <p style={{ color: 'var(--ink)', fontFamily: 'var(--sans)', marginBottom: '32px', maxWidth: '640px' }}>
            Городищу нужны стройматериалы, сырьё и инструменты. Если у вас есть возможность
            помочь — выберите позицию из списка и оставьте заявку. Мы свяжемся для уточнения деталей.
          </p>

          <div className="eyebrow" style={{ marginBottom: '24px' }}>
            <span />
            Список нужных материалов
            <span />
          </div>

          {materials.length === 0 ? (
            <p style={{ color: 'var(--olive-soft)', fontFamily: 'var(--sans)' }}>
              Список материалов пока пуст. Следите за обновлениями.
            </p>
          ) : (
            <MaterialsClient materials={materials} isLoggedIn={!!user} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
