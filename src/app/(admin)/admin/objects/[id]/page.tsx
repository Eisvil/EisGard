import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ObjectEditTabs } from '@/components/features/admin/ObjectEditTabs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function ObjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = (await createServerSupabaseClient()) as AnyClient;

  const { data: obj } = await supabase
    .from('objects')
    .select('*, slots(*)')
    .eq('id', id)
    .maybeSingle() as { data: Parameters<typeof ObjectEditTabs>[0]['object'] | null };

  if (!obj) notFound();

  return <ObjectEditTabs object={obj} />;
}
