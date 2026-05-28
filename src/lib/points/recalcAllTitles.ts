import { createServiceSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function recalcAllTitles(): Promise<void> {
  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  await supabase.rpc('recalc_all_titles');
}
