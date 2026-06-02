import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import NpcManager from '@/components/features/admin/NpcManager';
import TutorialStepsManager from '@/components/features/admin/TutorialStepsManager';
import QuestManager from '@/components/features/admin/QuestManager';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function NpcAdminPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const [
    { data: npcs },
    { data: steps },
    { data: quests },
    { data: objects },
  ] = await Promise.all([
    supabase
      .from('npcs')
      .select('id, name, portrait_url, position_x, position_y, is_active, sort_order')
      .order('sort_order'),
    supabase
      .from('tutorial_steps')
      .select('id, step_index, sort_order, title, text, selector, padding, interactive, interactive_hint, is_active')
      .order('sort_order'),
    supabase
      .from('quests')
      .select('id, title, description, reward_text, action_type, action_url, reward_points, object_id, npc_id, dialogs, is_active, sort_order, created_at')
      .order('sort_order'),
    supabase
      .from('objects')
      .select('id, name, slug')
      .order('name'),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">NPC / Квесты</h1>
        <p className="text-muted-foreground text-sm">
          Управление персонажами, обучением и заданиями.
        </p>
      </div>

      <Tabs defaultValue="npcs">
        <TabsList className="mb-6">
          <TabsTrigger value="npcs">Персонажи</TabsTrigger>
          <TabsTrigger value="tutorial">Обучение</TabsTrigger>
          <TabsTrigger value="quests">Квесты</TabsTrigger>
        </TabsList>

        <TabsContent value="npcs">
          <NpcManager initialNpcs={npcs ?? []} />
        </TabsContent>

        <TabsContent value="tutorial">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Шаги онбординга — показываются новым посетителям. Редактируйте заголовок и текст.
            </p>
          </div>
          <TutorialStepsManager initialSteps={steps ?? []} />
        </TabsContent>

        <TabsContent value="quests">
          <QuestManager
            initialQuests={quests ?? []}
            objects={objects ?? []}
            npcs={npcs ?? []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
