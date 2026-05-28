'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Check, X, Upload } from 'lucide-react';
import { formatMoney } from '@/lib/utils/formatMoney';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type SlotType = 'money' | 'labor';

type Slot = {
  id: string;
  slot_type: SlotType;
  name: string;
  goal_value: number;
  unit: string;
  current_value: number;
  is_closed: boolean;
  sort_order: number;
  image_url: string | null;
  description: string | null;
};

type Props = {
  objectId: string;
  initialSlots: Slot[];
};

const SLOT_TYPE_LABEL: Record<SlotType, string> = {
  money: 'Деньги',
  labor: 'Труд',
};

const DEFAULT_UNIT: Record<SlotType, string> = {
  money: 'RUB',
  labor: 'ч',
};

async function uploadSlotImage(file: File, slotId: string): Promise<{ url: string } | { error: string }> {
  if (file.size > 5 * 1024 * 1024) return { error: 'Файл слишком большой (максимум 5 МБ)' };
  const supabase = createBrowserSupabaseClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `slots/${slotId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('covers').upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: 'Ошибка загрузки: ' + error.message };
  const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
  return { url: publicUrl };
}

function SlotRow({
  slot,
  objectId,
  onUpdated,
  onDeleted,
}: {
  slot: Slot;
  objectId: string;
  onUpdated: (s: Slot) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing]       = useState(false);
  const [name, setName]             = useState(slot.name);
  const [goalValue, setGoalValue]   = useState(
    slot.unit === 'RUB' ? (slot.goal_value / 100).toString() : slot.goal_value.toString(),
  );
  const [unit, setUnit]             = useState(slot.unit);
  const [description, setDescription] = useState(slot.description ?? '');
  const [imageUrl, setImageUrl]     = useState(slot.image_url ?? '');
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]     = useState('');
  const [loading, setLoading]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setImgError('');
    const result = await uploadSlotImage(file, slot.id);
    if ('error' in result) setImgError(result.error);
    else setImageUrl(result.url);
    setImgUploading(false);
    e.target.value = '';
  }

  async function save() {
    setLoading(true);
    const parsed = parseInt(goalValue, 10);
    const goalKopecks = unit === 'RUB' ? parsed * 100 : parsed;
    const res = await fetch(`/api/admin/objects/${objectId}/slots/${slot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, goal_value: goalKopecks, unit,
        description: description.trim() || null,
        image_url: imageUrl || null,
      }),
    });
    if (res.ok) {
      onUpdated({ ...slot, name, goal_value: goalKopecks, unit, description: description.trim() || null, image_url: imageUrl || null });
      setEditing(false);
    }
    setLoading(false);
  }

  async function toggleClosed() {
    await fetch(`/api/admin/objects/${objectId}/slots/${slot.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_closed: !slot.is_closed }),
    });
    onUpdated({ ...slot, is_closed: !slot.is_closed });
  }

  async function deleteSlot() {
    await fetch(`/api/admin/objects/${objectId}/slots/${slot.id}`, { method: 'DELETE' });
    onDeleted(slot.id);
  }

  if (editing) {
    return (
      <tr className="bg-muted/50">
        <td colSpan={5} className="px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-end gap-3 flex-wrap">
              <div className="space-y-1 flex-1 min-w-40">
                <Label className="text-xs">Название</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1 w-32">
                <Label className="text-xs">Цель ({unit === 'RUB' ? '₽' : unit})</Label>
                <Input type="number" value={goalValue} onChange={(e) => setGoalValue(e.target.value)} className="h-8 text-sm" min={1} />
              </div>
              <div className="space-y-1 w-24">
                <Label className="text-xs">Ед.</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="h-8 text-sm" maxLength={20} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Описание</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm" rows={2} placeholder="Необязательно" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Изображение</Label>
              {imageUrl && (
                <div className="relative w-40 mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="" className="rounded h-24 w-40 object-cover border border-border" />
                  <button type="button" onClick={() => setImageUrl('')}
                    className="absolute top-0.5 right-0.5 bg-background/80 rounded p-0.5 hover:bg-background">
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageFile} />
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                  onClick={() => fileRef.current?.click()} disabled={imgUploading}>
                  <Upload size={12} className="mr-1" />{imgUploading ? 'Загружается...' : 'Загрузить'}
                </Button>
                {imgError && <span className="text-xs text-destructive">{imgError}</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={loading} className="h-8">
                <Check size={13} /> Сохранить
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8">
                <X size={13} />
              </Button>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2.5 text-sm">
        <div className="font-medium">{slot.name}</div>
        {slot.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{slot.description}</div>}
      </td>
      <td className="px-4 py-2.5">
        <Badge variant="outline" className="text-xs">{SLOT_TYPE_LABEL[slot.slot_type]}</Badge>
      </td>
      <td className="px-4 py-2.5 text-sm text-right tabular-nums">
        {slot.unit === 'RUB' ? formatMoney(slot.goal_value) : `${slot.goal_value} ${slot.unit}`}
      </td>
      <td className="px-4 py-2.5 text-sm text-right tabular-nums text-muted-foreground">
        {slot.unit === 'RUB' ? formatMoney(slot.current_value) : `${slot.current_value} ${slot.unit}`}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-1 justify-end">
          {slot.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={slot.image_url} alt="" className="w-7 h-7 rounded object-cover border border-border" />
          )}
          <button
            onClick={toggleClosed}
            className={`text-xs px-2 py-0.5 rounded border ${
              slot.is_closed ? 'bg-destructive/10 text-destructive border-destructive/30' : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {slot.is_closed ? 'Закрыт' : 'Открыт'}
          </button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-7 w-7 p-0">
            <Pencil size={13} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                <Trash2 size={13} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить слот «{slot.name}»?</AlertDialogTitle>
                <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSlot} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

export function SlotsManager({ objectId, initialSlots }: Props) {
  const [slots, setSlots]     = useState<Slot[]>(initialSlots);
  const [adding, setAdding]   = useState(false);
  const [newType, setNewType] = useState<SlotType>('money');
  const [newName, setNewName] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newUnit, setNewUnit] = useState('RUB');
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [imgError, setImgError]         = useState('');
  const [addLoading, setAddLoading]     = useState(false);
  const [addError, setAddError]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleTypeChange(t: SlotType) {
    setNewType(t);
    setNewUnit(DEFAULT_UNIT[t]);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUploading(true);
    setImgError('');
    const result = await uploadSlotImage(file, `new-${Date.now()}`);
    if ('error' in result) setImgError(result.error);
    else setNewImageUrl(result.url);
    setImgUploading(false);
    e.target.value = '';
  }

  async function handleAdd() {
    if (!newName.trim() || !newGoal) return;
    setAddLoading(true);
    setAddError('');

    const res = await fetch(`/api/admin/objects/${objectId}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot_type:   newType,
        name:        newName.trim(),
        goal_value:  newUnit === 'RUB' ? parseInt(newGoal, 10) * 100 : parseInt(newGoal, 10),
        unit:        newUnit,
        sort_order:  slots.length,
        description: newDesc.trim() || null,
        image_url:   newImageUrl || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setAddError(json.error?.message ?? 'Ошибка');
    } else {
      setSlots((prev) => [...prev, json.data as Slot]);
      setAdding(false);
      setNewName(''); setNewGoal(''); setNewType('money'); setNewUnit('RUB');
      setNewDesc(''); setNewImageUrl(''); setImgError('');
    }
    setAddLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Слоты ({slots.length})</h3>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus size={14} className="mr-1.5" /> Добавить слот
          </Button>
        )}
      </div>

      {slots.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">Название</th>
                <th className="px-4 py-2.5">Тип</th>
                <th className="px-4 py-2.5 text-right">Цель</th>
                <th className="px-4 py-2.5 text-right">Собрано</th>
                <th className="px-4 py-2.5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  objectId={objectId}
                  onUpdated={(updated) =>
                    setSlots((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
                  }
                  onDeleted={(id) => setSlots((prev) => prev.filter((s) => s.id !== id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Слотов нет. Добавьте хотя бы один для публикации объекта.</p>
      )}

      {adding && (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Новый слот</p>
          {addError && <p className="text-xs text-destructive">{addError}</p>}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <Label className="text-xs">Тип</Label>
              <Select value={newType} onValueChange={(v) => handleTypeChange(v as SlotType)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="money">Деньги</SelectItem>
                  <SelectItem value="labor">Труд</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Название *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" placeholder="Например: Горн" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Цель * {newUnit === 'RUB' ? '(₽)' : `(${newUnit})`}</Label>
              <Input type="number" value={newGoal} onChange={(e) => setNewGoal(e.target.value)} className="h-8 text-sm" min={1} placeholder={newUnit === 'RUB' ? '2000' : '10'} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Единица</Label>
              <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="h-8 text-sm" maxLength={20} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Описание</Label>
            <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="text-sm" rows={2} placeholder="Необязательно" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Изображение</Label>
            {newImageUrl && (
              <div className="relative w-40 mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={newImageUrl} alt="" className="rounded h-24 w-40 object-cover border border-border" />
                <button type="button" onClick={() => setNewImageUrl('')}
                  className="absolute top-0.5 right-0.5 bg-background/80 rounded p-0.5 hover:bg-background">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageFile} />
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs"
                onClick={() => fileRef.current?.click()} disabled={imgUploading}>
                <Upload size={12} className="mr-1" />{imgUploading ? 'Загружается...' : 'Загрузить'}
              </Button>
              {imgError && <span className="text-xs text-destructive">{imgError}</span>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={addLoading || !newName.trim() || !newGoal}>
              {addLoading ? 'Сохранение…' : 'Добавить'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setAddError(''); }}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
