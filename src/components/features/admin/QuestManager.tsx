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
import { Pencil, Trash2, Plus } from 'lucide-react';
import {
  adminCreateQuest, adminUpdateQuest, adminDeleteQuest,
  type QuestRow,
} from '@/app/actions/quests';

type ObjectOption = { id: string; name: string };

interface Props {
  initialQuests: QuestRow[];
  objects: ObjectOption[];
}

const ACTION_LABELS: Record<string, string> = {
  donate:    'Пожертвование',
  subscribe: 'Подписка',
  volunteer: 'Волонтёрство',
  material:  'Материалы',
  partner:   'Партнёрство',
};

const ACTION_TYPES = ['donate', 'subscribe', 'volunteer', 'material', 'partner'] as const;

type FormState = {
  title: string;
  description: string;
  reward_text: string;
  action_type: string;
  action_url: string;
  reward_points: number;
  object_id: string;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  reward_text: '',
  action_type: 'donate',
  action_url: '',
  reward_points: 0,
  object_id: '',
  is_active: true,
  sort_order: 0,
};

function toForm(q: QuestRow): FormState {
  return {
    title:         q.title,
    description:   q.description,
    reward_text:   q.reward_text ?? '',
    action_type:   q.action_type,
    action_url:    q.action_url ?? '',
    reward_points: q.reward_points,
    object_id:     q.object_id ?? '',
    is_active:     q.is_active,
    sort_order:    q.sort_order,
  };
}

export default function QuestManager({ initialQuests, objects }: Props) {
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
    setForm({ ...EMPTY_FORM, sort_order: quests.length + 1 });
    setError('');
    setDialogOpen(true);
  }

  function openEdit(q: QuestRow) {
    setEditingId(q.id);
    setForm(toForm(q));
    setError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Название и описание обязательны');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      title:         form.title.trim(),
      description:   form.description.trim(),
      reward_text:   form.reward_text.trim() || null,
      action_type:   form.action_type as QuestRow['action_type'],
      action_url:    form.action_url.trim() || null,
      reward_points: form.reward_points,
      object_id:     form.object_id || null,
      is_active:     form.is_active,
      sort_order:    form.sort_order,
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

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Квесты предлагаются пользователям через NPC Ведуна на карте.
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
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Баллы</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Квестов пока нет
                </TableCell>
              </TableRow>
            )}
            {quests.map(q => (
              <TableRow key={q.id}>
                <TableCell className="text-muted-foreground">{q.sort_order}</TableCell>
                <TableCell className="font-medium">{q.title}</TableCell>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать квест' : 'Новый квест'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="q-title">Название *</Label>
              <Input id="q-title" value={form.title} onChange={field('title')} maxLength={200} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-desc">Текст NPC *</Label>
              <Textarea id="q-desc" value={form.description} onChange={field('description')} rows={4} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-reward-text">Текст о награде</Label>
              <Input id="q-reward-text" value={form.reward_text} onChange={field('reward_text')} maxLength={300} placeholder="Ты получишь 500 баллов…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Тип действия *</Label>
                <Select value={form.action_type} onValueChange={v => setForm(prev => ({ ...prev, action_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="q-points">Баллы за выполнение</Label>
                <Input
                  id="q-points"
                  type="number"
                  min={0}
                  value={form.reward_points}
                  onChange={e => setForm(prev => ({ ...prev, reward_points: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="q-url">URL действия (CTA кнопка)</Label>
              <Input id="q-url" value={form.action_url} onChange={field('action_url')} placeholder="/donate" maxLength={500} />
            </div>

            <div className="space-y-1.5">
              <Label>Связанный объект</Label>
              <Select value={form.object_id || 'none'} onValueChange={v => setForm(prev => ({ ...prev, object_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без объекта</SelectItem>
                  {objects.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="q-order">Порядок</Label>
                <Input
                  id="q-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(prev => ({ ...prev, sort_order: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="q-active">Активен</Label>
                <div className="flex items-center h-9">
                  <input
                    id="q-active"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
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
              Это действие необратимо. Прогресс пользователей по этому квесту также будет удалён.
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
