import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ObjectsTable } from '@/components/features/admin/ObjectsTable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

async function getObjects() {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data } = await supabase
    .from('objects')
    .select('id, slug, name, zone, status, sort_order, total_goal_rub, total_raised_rub, created_at')
    .order('sort_order') as { data: Array<{
      id: string;
      slug: string;
      name: string;
      zone: string;
      status: string;
      sort_order: number;
      total_goal_rub: number;
      total_raised_rub: number;
      created_at: string;
    }> | null };
  return data ?? [];
}

export default async function ObjectsPage() {
  const objects = await getObjects();
  return <ObjectsTable objects={objects} />;
}
