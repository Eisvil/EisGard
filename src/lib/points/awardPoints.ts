import { createServiceSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type ProfileRow = { points: number; title_id: string | null };
type TitleRow = { id: string; name: string };

export async function awardPoints(userId: string, points: number): Promise<void> {
  if (points <= 0) return;

  const supabase = (await createServiceSupabaseClient()) as AnyClient;

  const { data: profile } = await supabase.rpc('increment_points', {
    p_user_id: userId,
    p_points: points,
  }) as { data: ProfileRow | null };

  if (!profile) return;

  const { data: title } = await supabase
    .from('titles')
    .select('id, name')
    .lte('min_points', profile.points)
    .order('min_points', { ascending: false })
    .limit(1)
    .maybeSingle() as { data: TitleRow | null };

  if (title && title.id !== profile.title_id) {
    await supabase.from('profiles').update({ title_id: title.id }).eq('id', userId);
  }
}
