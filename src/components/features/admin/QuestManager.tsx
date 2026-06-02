'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  adminCreateQuest, adminUpdateQuest, adminDeleteQuest,
  type QuestRow, type NpcRow, type DialogStep, type DialogChoice,
} from '@/app/actions/quests';
import { TiptapEditor } from '@/components/features/admin/TiptapEditor';

function toTiptapDoc(text: unknown): Record<string, unknown> {
  if (text && typeof text === 'object') return text as Record<string, unknown>;
  const str = typeof text === 'string' ? text : '';
  if (!str) return { type: 'doc', content: [] };
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: str }] }],
  };
}

type ObjectOption = { id: string; name: string; slug: string };

interface Props {
  initialQuests: QuestRow[];
  objects: ObjectOption[];
  npcs: NpcRow[];
}

const ACTION_LABELS: Record<string, string> = {
  donate:    'Пожертвование',
  subscribe: 'Подписка',
  volunteer: 'Волонтёрство',
  material:  'Материалы',
  partner:   'Партнёрство',
  dialog:    'Диалог',
};

const ACTION_TYPES = ['donate', 'subscribe', 'volunteer', 'material', 'partner', 'dialog'] as const;

const NEXT_LABELS: Record<DialogChoice['next'], string> = {
  next:    '→ Далее',
  accept:  '✓ Принять задание',
  decline: '✗ Отложить',
};

const NEXT_LABELS_DIALOG: Partial<Record<DialogChoice['next'], string>> = {
  next:    '✓ Правильный ответ',
  decline: '✗ Неправильный ответ',
};

function computeActionUrl(actionType: string, objectId: string, objects: ObjectOption[]): string | null {
  switch (actionType) {
    case 'donate':
    case 'subscribe': {
      if (objectId) {
        const obj = objects.find(o => o.id === objectId);
        return obj ? `/objects/${obj.slug}` : '/';
      }
      return '/';
    }
    case 'volunteer': return '/volunteers';
    case 'material':  return '/materials';
    case 'partner':   return '/partners';
    case 'dialog':    return null;
    default:          return null;
  }
}

type FormState = {
  title: string;
  description: string;
  reward_text: string;
  action_type: string;
  reward_points: number;
  object_id: string;
  npc_id: string;
  dialogs: DialogStep[];
  is_active: boolean;
  is_recurring: boolean;
  hide_npc_on_complete: boolean;
  prerequisite_quest_id: string;
  available_from: string;
  available_until: string;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  reward_text: '',
  action_type: 'donate',
  reward_points: 0,
  object_id: '',
  npc_id: '',
  dialogs: [],
  is_active: true,
  is_recurring: false,
  hide_npc_on_complete: false,
  prerequisite_quest_id: '',
  available_from: '',
  available_until: '',
  sort_order: 0,
};

function toForm(q: QuestRow): FormState {
  return {
    title:                 q.title,
    description:           q.description,
    reward_text:           q.reward_text ?? '',
    action_type:           q.action_type,
    reward_points:         q.reward_points,
    object_id:             q.object_id ?? '',
    npc_id:                q.npc_id ?? '',
    dialogs:               q.dialogs ?? [],
    is_active:             q.is_active,
    is_recurring:          q.is_recurring ?? false,
    hide_npc_on_complete:  q.hide_npc_on_complete ?? false,
    prerequisite_quest_id: q.prerequisite_quest_id ?? '',
    available_from:        q.available_from ?? '',
    available_until:       q.available_until ?? '',
    sort_order:            q.sort_order,
  };
}

// ─── Dialog step editor ───────────────────────────────────────────────────────

function DialogStepEditor({
  step,
  index,
  total,
  isDialogQuest,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  step: DialogStep;
  index: number;
  total: number;
  isDialogQuest: boolean;
  onChange: (s: DialogStep) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const nextOptions: DialogChoice['next'][] = isDialogQuest
    ? ['next', 'decline']
    : ['next', 'accept', 'decline'];
  const nextLabels = isDialogQuest ? NEXT_LABELS_DIALOG : NEXT_LABELS;

  return (
    <div className="rounded-md border border-border p-3 space-y-2 bg-muted/10">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs shrink-0">
          {index + 1}
        </Badge>
        <Select
          value={step.type}
          onValueChange={(v) => {
            if (v === 'text') onChange({ type: 'text', text: step.text ?? '' });
            else onChange({ type: 'choice', text: step.text ?? '', choices: [] });
          }}
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Текст</SelectItem>
            <SelectItem value="choice">Выбор</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <button type="button" onClick={onMoveUp} disabled={index === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronUp size={14} />
        </button>
        <button type="button" onClick={onMoveDown} disabled={index === total - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronDown size={14} />
        </button>
        <button type="button" onClick={onRemove} className="p-1 text-destructive hover:opacity-80">
          <X size={14} />
        </button>
      </div>

      <TiptapEditor
        value={toTiptapDoc(step.text)}
        onChange={json => onChange({ ...step, text: json })}
        simple
      />

      {step.type === 'choice' && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Варианты ответа:</p>
          {step.choices.map((choice, ci) => (
            <div key={ci} className="flex gap-2 items-center">
              <Input
                value={choice.label}
                onChange={e => {
                  const choices = step.choices.map((c, i) => i === ci ? { ...c, label: e.target.value } : c);
                  onChange({ ...step, choices });
                }}
                placeholder="Текст варианта"
                className="h-7 text-sm flex-1"
              />
              <Select
                value={choice.next}
                onValueChange={(v) => {
                  const choices = step.choices.map((c, i) => i === ci ? { ...c, next: v as DialogChoice['next'] } : c);
                  onChange({ ...step, choices });
                }}
              >
                <SelectTrigger className="h-7 w-44 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nextOptions.map(k => (
                    <SelectItem key={k} value={k}>{nextLabels[k] ?? NEXT_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => {
                  const choices = step.choices.filter((_, i) => i !== ci);
                  onChange({ ...step, choices });
                }}
                className="p-1 text-destructive hover:opacity-80 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange({ ...step, choices: [...step.choices, { label: '', next: 'next' }] })}
          >
            <Plus size={12} className="mr-1" /> Добавить вариант
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function QuestManager({ initialQuests, objects, npcs }: Props) {
  const [quests, setQuests] = useState<QuestRow[]>(initialQuests);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: quests.length + 1, npc_id: npcs[0]?.id ?? '' });
    setError('');
    setDialogOpen(true);
  }

  function openEdit(q: QuestRow) {
    setEditingId(q.id);
    setForm(toForm(q));
    setError('');
    setDialogOpen(true);
  }

  function updateDialog(index: number, step: DialogStep) {
    setForm(f => ({ ...f, dialogs: f.dialogs.map((s, i) => i === index ? step : s) }));
  }

  function removeDialog(index: number) {
    setForm(f => ({ ...f, dialogs: f.dialogs.filter((_, i) => i !== index) }));
  }

  function moveDialog(index: number, dir: -1 | 1) {
    setForm(f => {
      const d = [...f.dialogs];
      const target = index + dir;
      if (target < 0 || target >= d.length) return f;
      [d[index], d[target]] = [d[target], d[index]];
      return { ...f, dialogs: d };
    });
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Название обязательно'); return; }
    setSaving(true);
    setError('');

    const payload = {
      title:                 form.title.trim(),
      description:           form.description.trim(),
      reward_text:           form.reward_text.trim() || null,
      action_type:           form.action_type as QuestRow['action_type'],
      action_url:            computeActionUrl(form.action_type, form.object_id, objects),
      reward_points:         form.reward_points,
      object_id:             form.object_id || null,
      npc_id:                form.npc_id || null,
      dialogs:               form.dialogs,
      is_active:             form.is_active,
      is_recurring:          form.is_recurring,
      hide_npc_on_complete:  form.hide_npc_on_complete,
      prerequisite_quest_id: form.prerequisite_quest_id || null,
      available_from:        form.available_from || null,
      available_until:       form.available_until || null,
      sort_order:            form.sort_order,
    };

    try {
      if (editingId) {
        const { quest, error: err } = await adminUpdateQuest(editingId, payload);
        if (err || !quest) throw new Error(err ?? 'Ошибка обновления');
        setQuests(prev => prev.map(q => q.id === editingId ? quest : q));
        showToast('Квест обновлён');
      } else {
        const { quest, error: err } = await adminCreateQuest(payload);
        if (err || !quest) throw new Error(err ?? 'Ошибка создания');
        setQuests(prev => [...prev, quest].sort((a, b) => a.sort_order - b.sort_order));
        showToast('Квест создан');
      }
      setDialogOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error: err } = await adminDeleteQuest(deleteId);
    if (err) {
      showToast('Ошибка удаления: ' + err);
    } else {
      setQuests(prev => prev.filter(q => q.id !== deleteId));
      showToast('Квест удалён');
    }
    setDeleteId(null);
  }

  const npcMap = Object.fromEntries(npcs.map(n => [n.id, n.name]));

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Квесты предлагаются пользователям при клике на NPC-персонажа на карте.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1" /> Добавить квест
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>NPC</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Баллы</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Квестов пока нет
                </TableCell>
              </TableRow>
            )}
            {quests.map(q => (
              <TableRow key={q.id}>
                <TableCell className="text-muted-foreground">{q.sort_order}</TableCell>
                <TableCell className="font-medium">{q.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {q.npc_id ? (npcMap[q.npc_id] ?? '—') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ACTION_LABELS[q.action_type] ?? q.action_type}</Badge>
                </TableCell>
                <TableCell className="text-right">{q.reward_points}</TableCell>
                <TableCell>
                  <Badge variant={q.is_active ? 'default' : 'secondary'}>
                    {q.is_active ? 'Активен' : 'Скрыт'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)}>
                      <Trash2 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать квест' : 'Новый квест'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-title">Название *</Label>
              <Input
                id="q-title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={200}
              />
            </div>

            {/* NPC selector */}
            {npcs.length > 0 && (
              <div className="space-y-1.5">
                <Label>Персонаж (NPC)</Label>
                <Select value={form.npc_id || 'none'} onValueChange={v => setForm(f => ({ ...f, npc_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без NPC</SelectItem>
                    {npcs.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Тип действия + связанный объект */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Тип действия *</Label>
                <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Связанный объект</Label>
                <Select
                  value={form.object_id || 'none'}
                  onValueChange={v => setForm(f => ({ ...f, object_id: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без объекта</SelectItem>
                    {objects.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Вычисляемый URL (read-only) */}
            {form.action_type !== 'dialog' && (
              <div className="space-y-1 rounded-md bg-muted/40 border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground font-medium">CTA кнопка ведёт на:</p>
                <p className="text-sm font-mono">
                  {computeActionUrl(form.action_type, form.object_id, objects) ?? '—'}
                </p>
              </div>
            )}
            {form.action_type === 'dialog' && (
              <div className="rounded-md bg-muted/40 border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Тип «Диалог» — задание выполняется прямо в диалоговом окне NPC. CTA-кнопка не показывается.
                </p>
              </div>
            )}

            {/* Dialogs section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  {form.action_type === 'dialog' ? 'Шаги диалога (вопросы и ответы)' : 'Диалоги NPC'}
                </Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setForm(f => ({ ...f, dialogs: [...f.dialogs, { type: 'text', text: '' }] }))}
                  >
                    <Plus size={12} className="mr-1" /> Текст
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setForm(f => ({ ...f, dialogs: [...f.dialogs, { type: 'choice', text: '', choices: [] }] }))}
                  >
                    <Plus size={12} className="mr-1" /> Выбор
                  </Button>
                </div>
              </div>
              {form.dialogs.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  {form.action_type === 'dialog'
                    ? 'Добавьте шаги — текстовые и с выбором ответа.'
                    : 'Диалогов нет — будет использоваться поле «Описание» ниже.'}
                </p>
              )}
              <div className="space-y-2">
                {form.dialogs.map((step, i) => (
                  <DialogStepEditor
                    key={i}
                    step={step}
                    index={i}
                    total={form.dialogs.length}
                    isDialogQuest={form.action_type === 'dialog'}
                    onChange={s => updateDialog(i, s)}
                    onRemove={() => removeDialog(i)}
                    onMoveUp={() => moveDialog(i, -1)}
                    onMoveDown={() => moveDialog(i, 1)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-desc">
                {form.action_type === 'dialog' ? 'Описание (не отображается в диалоге)' : 'Описание (fallback если нет диалогов)'}
              </Label>
              <Textarea
                id="q-desc"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-reward-text">Текст о награде</Label>
              <Input
                id="q-reward-text"
                value={form.reward_text}
                onChange={e => setForm(f => ({ ...f, reward_text: e.target.value }))}
                maxLength={300}
                placeholder="Ты получишь 500 баллов…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-points">Баллы за выполнение</Label>
              <Input
                id="q-points"
                type="number"
                min={0}
                value={form.reward_points}
                onChange={e => setForm(f => ({ ...f, reward_points: Number(e.target.value) }))}
              />
            </div>

            {/* Условия видимости и поведения */}
            <div className="rounded-md border border-border p-3 space-y-2 bg-muted/10">
              <p className="text-xs font-medium text-muted-foreground">Условия и поведение</p>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hide_npc_on_complete}
                  onChange={e => setForm(f => ({ ...f, hide_npc_on_complete: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Скрыть NPC с карты пока задание выполнено</span>
              </label>

              {form.action_type === 'subscribe' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Повторяющийся — сбрасывается при отмене подписки</span>
                </label>
              )}
            </div>

            {/* Требуемый квест (цепочка) */}
            <div className="space-y-1.5">
              <Label>Требуемый квест (цепочка)</Label>
              <Select
                value={form.prerequisite_quest_id || 'none'}
                onValueChange={v => setForm(f => ({ ...f, prerequisite_quest_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Без требования" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без требования</SelectItem>
                  {quests.filter(q => q.id !== editingId).map(q => (
                    <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.prerequisite_quest_id && (
                <p className="text-xs text-muted-foreground">Квест будет виден только после выполнения выбранного.</p>
              )}
            </div>

            {/* Период доступности */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-from">Доступен с</Label>
                <Input
                  id="q-from"
                  type="datetime-local"
                  value={form.available_from}
                  onChange={e => setForm(f => ({ ...f, available_from: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-until">Доступен до</Label>
                <Input
                  id="q-until"
                  type="datetime-local"
                  value={form.available_until}
                  onChange={e => setForm(f => ({ ...f, available_until: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-order">Порядок</Label>
                <Input
                  id="q-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="q-active">Активен</Label>
                <div className="flex items-center h-9">
                  <input
                    id="q-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить квест?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Прогресс пользователей по квесту также будет удалён.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
