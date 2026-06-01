import { NextResponse } from 'next/server';
import { createStaticSupabaseClient } from '@/lib/supabase/static';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export const revalidate = 300;

export async function GET() {
  const supabase = createStaticSupabaseClient() as AnyClient;
  const { data, error } = await supabase
    .from('tutorial_steps')
    .select('id, step_index, sort_order, title, text, selector, padding, interactive, interactive_hint')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 });
  }

  return NextResponse.json(
    { data },
    { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' } }
  );
}
