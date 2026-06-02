'use server';

import { z } from 'zod';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/points/awardPoints';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

// ─── NPC ──────────────────────────────────────────────────────────────────────

export type NpcRow = {
  id: string;
  name: string;
  portrait_url: string | null;
  position_x: number;
  position_y: number;
  is_active: boolean;
  sort_order: number;
};

// ─── Dialog steps ────────────────────────────────────────────────────────────

export type DialogChoice = {
  label: string;
  next: 'next' | 'accept' | 'decline';
};

export type DialogStep =
  | { type: 'text'; text: string | Record<string, unknown> }
  | { type: 'choice'; text: string | Record<string, unknown>; choices: DialogChoice[] };

// ─── Quests ───────────────────────────────────────────────────────────────────

export type QuestActionType = 'donate' | 'subscribe' | 'volunteer' | 'material' | 'partner' | 'dialog';

export type QuestWithStatus = {
  id: string;
  title: string;
  description: string;
  reward_text: string | null;
  action_type: QuestActionType;
  action_url: string | null;
  reward_points: number;
  object_id: string | null;
  npc_id: string | null;
  dialogs: DialogStep[];
  sort_order: number;
  is_recurring: boolean;
  hide_npc_on_complete: boolean;
  prerequisite_quest_id: string | null;
  available_from: string | null;
  available_until: string | null;
  reactivated_count: number;
  status: 'new' | 'accepted' | 'completed';
};

export type QuestRow = {
  id: string;
  title: string;
  description: string;
  reward_text: string | null;
  action_type: QuestActionType;
  action_url: string | null;
  reward_points: number;
  object_id: string | null;
  npc_id: string | null;
  dialogs: DialogStep[];
  is_active: boolean;
  is_recurring: boolean;
  hide_npc_on_complete: boolean;
  prerequisite_quest_id: string | null;
  available_from: string | null;
  available_until: string | null;
  sort_order: number;
  created_at: string;
};

// ─── Public: get available quests with user status ──────────────────────────

export async function getAvailableQuests(userId?: string, npcId?: string): Promise<QuestWithStatus[]> {
  const supabase = (await createServerSupabaseClient()) as AnyClient;

  const now = new Date().toISOString();

  let query = supabase
    .from('quests')
    .select('id, title, description, reward_text, action_type, action_url, reward_points, object_id, npc_id, dialogs, sort_order, is_recurring, hide_npc_on_complete, prerequisite_quest_id, available_from, available_until')
    .eq('is_active', true)
    .or(`available_from.is.null,available_from.lte.${now}`)
    .or(`available_until.is.null,available_until.gte.${now}`)
    .order('sort_order');

  if (npcId) {
    query = query.eq('npc_id', npcId);
  }

  const { data: quests } = await query as { data: Omit<QuestWithStatus, 'status'>[] | null };

  if (!quests?.length) return [];

  if (!userId) {
    return quests.map(q => ({
      ...q,
      reactivated_count: 0,
      status: 'new' as const,
    }));
  }

  const { data: userQuests } = await supabase
    .from('user_quests')
    .select('quest_id, status, reactivated_count')
    .eq('user_id', userId) as { data: { quest_id: string; status: string; reactivated_count: number }[] | null };

  const statusMap = new Map((userQuests ?? []).map(uq => [uq.quest_id, uq]));
  const completedIds = new Set(
    (userQuests ?? []).filter(uq => uq.status === 'completed').map(uq => uq.quest_id)
  );

  return quests
    .filter(q => {
      if (!q.prerequisite_quest_id) return true;
      return completedIds.has(q.prerequisite_quest_id);
    })
    .map(q => {
      const uq = statusMap.get(q.id);
      return {
        ...q,
        reactivated_count: uq?.reactivated_count ?? 0,
        status: (uq?.status ?? 'new') as QuestWithStatus['status'],
      };
    });
}

// ─── Public: accept quest ────────────────────────────────────────────────────

const acceptQuestSchema = z.object({ questId: z.string().uuid() });

export async function acceptQuest(questId: string): Promise<{ error?: string }> {
  const parsed = acceptQuestSchema.safeParse({ questId });
  if (!parsed.success) return { error: 'Некорректный ID квеста' };

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Требуется авторизация' };

  const { error } = await supabase
    .from('user_quests')
    .upsert(
      { user_id: user.id, quest_id: questId, status: 'accepted', offered_at: new Date().toISOString() },
      { onConflict: 'user_id,quest_id', ignoreDuplicates: false },
    );

  if (error) return { error: 'Не удалось принять задание' };
  return {};
}

// ─── Public: complete quest ──────────────────────────────────────────────────

const completeQuestSchema = z.object({ questId: z.string().uuid() });

export async function completeQuest(questId: string): Promise<{ error?: string }> {
  const parsed = completeQuestSchema.safeParse({ questId });
  if (!parsed.success) return { error: 'Некорректный ID квеста' };

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Требуется авторизация' };

  const { data: quest } = await supabase
    .from('quests')
    .select('reward_points')
    .eq('id', questId)
    .maybeSingle() as { data: { reward_points: number } | null };

  if (!quest) return { error: 'Квест не найден' };

  // Upsert: создаём запись если её нет (dialog-квесты могут завершаться без предварительного acceptQuest)
  const { data: existing } = await supabase
    .from('user_quests')
    .select('status')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .maybeSingle() as { data: { status: string } | null };

  if (existing?.status === 'completed') return {};

  await supabase
    .from('user_quests')
    .upsert(
      { user_id: user.id, quest_id: questId, status: 'completed', completed_at: new Date().toISOString() },
      { onConflict: 'user_id,quest_id' },
    );

  if (quest.reward_points > 0) {
    await awardPoints(user.id, quest.reward_points);
  }

  return {};
}

// ─── Service-role: авто-завершение квестов по действию ───────────────────────

export async function autoCompleteQuestsOnAction(
  userId: string,
  actionType: string,
  objectId?: string | null,
): Promise<void> {
  const supabase = (await createServiceSupabaseClient()) as AnyClient;

  // Для subscribe-типа: включаем 'offered' (= recurring квест после сброса)
  const statusFilter = actionType === 'subscribe' ? ['accepted', 'offered'] : ['accepted'];

  const { data: userQuests } = await supabase
    .from('user_quests')
    .select('quest_id, quests!inner(action_type, object_id, reward_points)')
    .eq('user_id', userId)
    .in('status', statusFilter)
    .eq('quests.action_type', actionType) as {
      data: Array<{
        quest_id: string;
        quests: { action_type: string; object_id: string | null; reward_points: number };
      }> | null;
    };

  if (!userQuests?.length) return;

  for (const uq of userQuests) {
    const questObjectId = uq.quests.object_id;
    // Если квест привязан к объекту — должен совпасть; квест без object_id = любое действие
    if (objectId && questObjectId && questObjectId !== objectId) continue;

    const { error } = await supabase
      .from('user_quests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('quest_id', uq.quest_id)
      .eq('status', 'accepted');

    if (!error && uq.quests.reward_points > 0) {
      await awardPoints(userId, uq.quests.reward_points);
    }
  }
}

// ─── Service-role: сброс recurring-квестов при лапсе подписки ────────────────

export async function resetRecurringQuestsOnSubscriptionLapse(
  userId: string,
  objectId?: string | null,
): Promise<void> {
  const supabase = (await createServiceSupabaseClient()) as AnyClient;

  const { data: completedRecurring } = await supabase
    .from('user_quests')
    .select('quest_id, quests!inner(action_type, is_recurring, object_id)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .eq('quests.action_type', 'subscribe')
    .eq('quests.is_recurring', true) as {
      data: Array<{
        quest_id: string;
        quests: { action_type: string; is_recurring: boolean; object_id: string | null };
      }> | null;
    };

  if (!completedRecurring?.length) return;

  for (const uq of completedRecurring) {
    const questObjectId = uq.quests.object_id;
    if (objectId && questObjectId && questObjectId !== objectId) continue;

    // Читаем текущий счётчик чтобы атомарно инкрементировать
    const { data: current } = await supabase
      .from('user_quests')
      .select('reactivated_count')
      .eq('user_id', userId)
      .eq('quest_id', uq.quest_id)
      .maybeSingle() as { data: { reactivated_count: number } | null };

    await supabase
      .from('user_quests')
      .update({
        status: 'offered',
        completed_at: null,
        reactivated_count: (current?.reactivated_count ?? 0) + 1,
      })
      .eq('user_id', userId)
      .eq('quest_id', uq.quest_id);
  }
}

// ─── Admin helpers ───────────────────────────────────────────────────────────

async function getAdminUserId(): Promise<string | null> {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: { role: string } | null };
  if (!profile || profile.role !== 'admin') return null;
  return user.id;
}

// ─── Admin: CRUD quests ───────────────────────────────────────────────────────

const dialogChoiceSchema = z.object({
  label: z.string().min(1).max(200),
  next: z.enum(['next', 'accept', 'decline']),
});

const textOrDocSchema = z.union([
  z.string().min(1),
  z.record(z.string(), z.unknown()),
]);

const dialogStepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: textOrDocSchema }),
  z.object({ type: z.literal('choice'), text: textOrDocSchema, choices: z.array(dialogChoiceSchema).min(1) }),
]);

const questBodySchema = z.object({
  title:                  z.string().min(1).max(200),
  description:            z.string().min(0).default(''),
  reward_text:            z.string().max(300).nullable().optional(),
  action_type:            z.enum(['donate','subscribe','volunteer','material','partner','dialog']),
  action_url:             z.string().max(500).nullable().optional(),
  reward_points:          z.number().int().min(0),
  object_id:              z.string().uuid().nullable().optional(),
  npc_id:                 z.string().uuid().nullable().optional(),
  dialogs:                z.array(dialogStepSchema).optional(),
  is_active:              z.boolean().optional(),
  is_recurring:           z.boolean().optional(),
  hide_npc_on_complete:   z.boolean().optional(),
  prerequisite_quest_id:  z.string().uuid().nullable().optional(),
  available_from:         z.string().nullable().optional(),
  available_until:        z.string().nullable().optional(),
  sort_order:             z.number().int().min(0).optional(),
});

export async function adminCreateQuest(
  data: z.infer<typeof questBodySchema>,
): Promise<{ quest?: QuestRow; error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };

  const parsed = questBodySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };

  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { data: quest, error } = await supabase
    .from('quests')
    .insert(parsed.data)
    .select()
    .single() as { data: QuestRow | null; error: unknown };

  if (error || !quest) return { error: 'Не удалось создать квест' };
  return { quest };
}

const updateSchema = z.object({ id: z.string().uuid() }).merge(questBodySchema.partial());

export async function adminUpdateQuest(
  id: string,
  data: Partial<z.infer<typeof questBodySchema>>,
): Promise<{ quest?: QuestRow; error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };

  const parsed = updateSchema.safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };

  const { id: _id, ...fields } = parsed.data;

  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { data: quest, error } = await supabase
    .from('quests')
    .update(fields)
    .eq('id', id)
    .select()
    .single() as { data: QuestRow | null; error: unknown };

  if (error || !quest) return { error: 'Не удалось обновить квест' };
  return { quest };
}

export async function adminDeleteQuest(id: string): Promise<{ error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: 'Некорректный ID' };
  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { error } = await supabase.from('quests').delete().eq('id', id);
  if (error) return { error: 'Не удалось удалить квест' };
  return {};
}

export async function adminReorderQuests(ids: string[]): Promise<{ error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };
  const parsed = z.array(z.string().uuid()).safeParse(ids);
  if (!parsed.success) return { error: 'Некорректные ID' };
  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  await Promise.all(ids.map((id, index) =>
    supabase.from('quests').update({ sort_order: index + 1 }).eq('id', id),
  ));
  return {};
}

// ─── Admin: CRUD NPC ─────────────────────────────────────────────────────────

const npcBodySchema = z.object({
  name:         z.string().min(1).max(100),
  portrait_url: z.string().max(500).nullable().optional(),
  position_x:   z.number().min(0).max(100),
  position_y:   z.number().min(0).max(100),
  is_active:    z.boolean().optional(),
  sort_order:   z.number().int().min(0).optional(),
});

export async function adminCreateNpc(
  data: z.infer<typeof npcBodySchema>,
): Promise<{ npc?: NpcRow; error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };

  const parsed = npcBodySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };

  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { data: npc, error } = await supabase
    .from('npcs')
    .insert(parsed.data)
    .select()
    .single() as { data: NpcRow | null; error: unknown };

  if (error) return { error: `Не удалось создать персонажа: ${(error as { message?: string })?.message ?? String(error)}` };
  if (!npc) return { error: 'Не удалось создать персонажа' };
  return { npc };
}

const npcUpdateSchema = z.object({ id: z.string().uuid() }).merge(npcBodySchema.partial());

export async function adminUpdateNpc(
  id: string,
  data: Partial<z.infer<typeof npcBodySchema>>,
): Promise<{ npc?: NpcRow; error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };

  const parsed = npcUpdateSchema.safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };

  const { id: _id, ...fields } = parsed.data;

  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { data: npc, error } = await supabase
    .from('npcs')
    .update(fields)
    .eq('id', id)
    .select()
    .single() as { data: NpcRow | null; error: unknown };

  if (error) return { error: `Не удалось обновить персонажа: ${(error as { message?: string })?.message ?? String(error)}` };
  if (!npc) return { error: 'Не удалось обновить персонажа' };
  return { npc };
}

export async function adminDeleteNpc(id: string): Promise<{ error?: string }> {
  if (!await getAdminUserId()) return { error: 'Нет доступа' };
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { error: 'Некорректный ID' };
  const supabase = (await createServiceSupabaseClient()) as AnyClient;
  const { error } = await supabase.from('npcs').delete().eq('id', id);
  if (error) return { error: `Не удалось удалить персонажа: ${(error as { message?: string })?.message ?? String(error)}` };
  return {};
}
