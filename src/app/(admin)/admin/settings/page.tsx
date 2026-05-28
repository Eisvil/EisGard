import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { SettingsManager } from '@/components/features/admin/SettingsManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

type Title = {
  id: string;
  name: string;
  min_points: number;
  description: string | null;
  privileges: string | null;
  sort_order: number;
};

type Skill = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
};

export default async function SettingsPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const [{ data: titles }, { data: skills }, { data: settingsRows }] = await Promise.all([
    supabase
      .from('titles')
      .select('id, name, min_points, description, privileges, sort_order')
      .order('sort_order', { ascending: true }) as Promise<{ data: Title[] | null }>,
    supabase
      .from('skills')
      .select('id, name, category, sort_order')
      .order('sort_order', { ascending: true }) as Promise<{ data: Skill[] | null }>,
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['points_per_ruble', 'points_per_day']) as Promise<{
      data: { key: string; value: unknown }[] | null;
    }>,
  ]);

  const settingsMap: Record<string, number> = {};
  for (const row of settingsRows ?? []) {
    settingsMap[row.key] = Number(row.value);
  }

  const initialSettings = {
    points_per_ruble: settingsMap['points_per_ruble'] ?? 1,
    points_per_day: settingsMap['points_per_day'] ?? 1000,
  };

  return (
    <SettingsManager
      initialTitles={titles ?? []}
      initialSkills={skills ?? []}
      initialSettings={initialSettings}
    />
  );
}
