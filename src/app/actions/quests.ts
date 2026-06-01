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
  | { type: 'text'; text: string }
  | { type: 'choice'; text: string; choices: DialogChoice[] };

// ─── Quests ───────────────────────────────────────────────────────────────────

export type QuestWithStatus = {
  id: string;
  title: string;
  description: string;
  reward_text: string | null;
  action_type: 'donate' | 'subscribe' | 'volunteer' | 'material' | 'partner';
  action_url: string | null;
  reward_points: number;
  object_id: string | null;
  npc_id: string | null;
  dialogs: DialogStep[];
  sort_order: number;
  status: 'new' | 'accepted' | 'completed';
};

export type QuestRow = {
  id: string;
  title: string;
  description: string;
  reward_text: string | null;
  action_type: 'donate' | 'subscribe' | 'volunteer' | 'material' | 'partner';
  action_url: string | null;
  reward_points: number;
  object_id: string | null;
  npc_id: string | null;
  dialogs: DialogStep[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

// ─── Public: get available quests with user status ──────────────────────────

export async function getAvailableQuests(userId?: string, npcId?: string): Promise<QuestWithStatus[]> {
  const supabase = (await createServerSupabaseClient()) as AnyClient;

  let query = supabase
    .from('quests')
    .select('id, title, description, reward_text, action_type, action_url, reward_points, object_id, npc_id, dialogs, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (npcId) {
    query = query.eq('npc_id', npcId);
  }

  const { data: quests } = await query as { data: Omit<QuestWithStatus, 'status'>[] | null };

  if (!quests?.length) return [];

  if (!userId) {
    return quests.map(q => ({ ...q, status: 'new' as const }));
  }

  const { data: userQuests } = await supabase
    .from('user_quests')
    .select('quest_id, status')
    .eq('user_id', userId) as { data: { quest_id: string; status: string }[] | null };

  const statusMap = new Map((userQuests ?? []).map(uq => [uq.quest_id, uq.status]));

  return quests.map(q => ({
    ...q,
    status: (statusMap.get(q.id) ?? 'new') as QuestWithStatus['status'],
  }));
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

  const { data: userQuest } = await supabase
    .from('user_quests')
    .select('status')
    .eq('user_id', user.id)
    .eq('quest_id', questId)
    .maybeSingle() as { data: { status: string } | null };

  if (!userQuest) return { error: 'Задание не найдено' };
  if (userQuest.status === 'completed') return {};

  const { data: quest } = await supabase
    .from('quests')
    .select('reward_points')
    .eq('id', questId)
    .maybeSingle() as { data: { reward_points: number } | null };

  if (!quest) return { error: 'Квест не найден' };

  const { error } = await supabase
    .from('user_quests')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('quest_id', questId);

  if (error) return { error: 'Не удалось завершить задание' };

  if (quest.reward_points > 0) {
    await awardPoints(user.id, quest.reward_points);
  }

  return {};
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

const dialogStepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().min(1) }),
  z.object({ type: z.literal('choice'), text: z.string().min(1), choices: z.array(dialogChoiceSchema).min(1) }),
]);

const questBodySchema = z.object({
  title:         z.string().min(1).max(200),
  description:   z.string().min(0).default(''),
  reward_text:   z.string().max(300).nullable().optional(),
  action_type:   z.enum(['donate','subscribe','volunteer','material','partner']),
  action_url:    z.string().max(500).nullable().optional(),
  reward_points: z.number().int().min(0),
  object_id:     z.string().uuid().nullable().optional(),
  npc_id:        z.string().uuid().nullable().optional(),
  dialogs:       z.array(dialogStepSchema).optional(),
  is_active:     z.boolean().optional(),
  sort_order:    z.number().int().min(0).optional(),
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
