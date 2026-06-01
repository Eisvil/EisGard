import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import QuestManager from '@/components/features/admin/QuestManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function QuestsAdminPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const [{ data: quests }, { data: objects }] = await Promise.all([
    supabase
      .from('quests')
      .select('id, title, description, reward_text, action_type, action_url, reward_points, object_id, is_active, sort_order, created_at')
      .order('sort_order'),
    supabase
      .from('objects')
      .select('id, name')
      .order('name'),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Квесты</h1>
        <p className="text-muted-foreground text-sm">
          Задания Ведуна — предлагаются пользователям при клике на NPC-иконку на карте.
          Позиция NPC настраивается во вкладке «NPC» в Настройках.
        </p>
      </div>
      <QuestManager
        initialQuests={quests ?? []}
        objects={objects ?? []}
      />
    </div>
  );
}
