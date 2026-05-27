import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: rawMaterials, error } = await supabase
    .from('materials')
    .select('id, name, description, unit, needed_qty, received_qty, is_active, sort_order, object_id, objects(name, slug)')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Не удалось загрузить список материалов' } },
      { status: 500 }
    );
  }

  const materials = (rawMaterials ?? []) as MaterialRow[];

  const data = materials.map((m) => {
    const percent =
      m.needed_qty && m.needed_qty > 0
        ? Math.min(100, Math.round((m.received_qty / m.needed_qty) * 100))
        : 0;

    return {
      id: m.id,
      name: m.name,
      description: m.description,
      unit: m.unit,
      needed_qty: m.needed_qty,
      received_qty: m.received_qty,
      percent,
      object_id: m.object_id,
      object_name: m.objects?.name ?? null,
      object_slug: m.objects?.slug ?? null,
    };
  });

  return NextResponse.json({ data, meta: { total: data.length } });
}
