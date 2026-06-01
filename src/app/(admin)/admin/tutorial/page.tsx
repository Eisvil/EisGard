import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import TutorialStepsManager from '@/components/features/admin/TutorialStepsManager';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export default async function TutorialAdminPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) {
    return <div className="p-6 text-red-600">Нет доступа</div>;
  }
  const { supabase } = ctx as { supabase: AnyClient };

  const { data: steps } = await supabase
    .from('tutorial_steps')
    .select('id, step_index, sort_order, title, text, selector, padding, interactive, interactive_hint, is_active')
    .order('sort_order', { ascending: true });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Задания — Туториал</h1>
        <p className="text-muted-foreground text-sm">
          Шаги онбординга NPC. Редактируйте заголовок и текст — изменения сразу видны новым посетителям.
        </p>
      </div>
      <TutorialStepsManager initialSteps={steps ?? []} />
    </div>
  );
}
