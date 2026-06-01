'use client';

import { useRef, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Upload } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { adminCreateNpc, adminUpdateNpc, adminDeleteNpc, type NpcRow } from '@/app/actions/quests';

interface Props {
  initialNpcs: NpcRow[];
}

type FormState = {
  name: string;
  portrait_url: string;
  position_x: number;
  position_y: number;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  name: 'Ведун',
  portrait_url: '',
  position_x: 50,
  position_y: 50,
  is_active: true,
  sort_order: 1,
};

export default function NpcManager({ initialNpcs }: Props) {
  const [npcs, setNpcs] = useState<NpcRow[]>(initialNpcs);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapPickerRef = useRef<HTMLDivElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: npcs.length + 1 });
    setError('');
    setDialogOpen(true);
  }

  function openEdit(npc: NpcRow) {
    setEditingId(npc.id);
    setForm({
      name:         npc.name,
      portrait_url: npc.portrait_url ?? '',
      position_x:   npc.position_x,
      position_y:   npc.position_y,
      is_active:    npc.is_active,
      sort_order:   npc.sort_order,
    });
    setError('');
    setDialogOpen(true);
  }

  async function handlePortraitUpload(file: File) {
    if (file.size > 3 * 1024 * 1024) { setError('Файл слишком большой (макс. 3 МБ)'); return; }
    setUploading(true);
    setError('');
    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split('.').pop() ?? 'png';
      const path = `npcs/${editingId ?? 'new'}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('covers').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { setError('Ошибка загрузки: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      setForm(f => ({ ...f, portrait_url: publicUrl }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    const el = mapPickerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setForm(f => ({ ...f, position_x: Math.max(0, Math.min(100, x)), position_y: Math.max(0, Math.min(100, y)) }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Имя обязательно'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name:         form.name.trim(),
      portrait_url: form.portrait_url || null,
      position_x:   form.position_x,
      position_y:   form.position_y,
      is_active:    form.is_active,
      sort_order:   form.sort_order,
    };

    try {
      if (editingId) {
        const { npc, error: err } = await adminUpdateNpc(editingId, payload);
        if (err || !npc) throw new Error(err ?? 'Ошибка обновления');
        setNpcs(prev => prev.map(n => n.id === editingId ? npc : n));
        showToast('Персонаж обновлён');
      } else {
        const { npc, error: err } = await adminCreateNpc(payload);
        if (err || !npc) throw new Error(err ?? 'Ошибка создания');
        setNpcs(prev => [...prev, npc].sort((a, b) => a.sort_order - b.sort_order));
        showToast('Персонаж создан');
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
    const { error: err } = await adminDeleteNpc(deleteId);
    if (err) {
      showToast('Ошибка удаления: ' + err);
    } else {
      setNpcs(prev => prev.filter(n => n.id !== deleteId));
      showToast('Персонаж удалён');
    }
    setDeleteId(null);
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
          NPC-персонажи отображаются на карте городища. Клик по NPC открывает его квесты.
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus size={15} className="mr-1" /> Добавить персонажа
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Арт</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead>Позиция</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {npcs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Персонажей нет
                </TableCell>
              </TableRow>
            )}
            {npcs.map(npc => (
              <TableRow key={npc.id}>
                <TableCell>
                  {npc.portrait_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={npc.portrait_url} alt="" className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full border border-dashed border-border bg-muted/20 flex items-center justify-center text-muted-foreground text-lg">
                      👤
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{npc.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  X: {npc.position_x}% / Y: {npc.position_y}%
                </TableCell>
                <TableCell>
                  <Badge variant={npc.is_active ? 'default' : 'secondary'}>
                    {npc.is_active ? 'Активен' : 'Скрыт'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(npc)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(npc.id)}>
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
            <DialogTitle>{editingId ? 'Редактировать персонажа' : 'Новый персонаж'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Portrait */}
            <div className="space-y-2">
              <Label>Портрет</Label>
              <div className="flex items-center gap-3">
                {form.portrait_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.portrait_url} alt="" className="w-16 h-16 rounded-full object-cover border border-border flex-none" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-2xl flex-none">👤</div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { handlePortraitUpload(f); e.target.value = ''; }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} className="mr-1.5" />
                    {uploading ? 'Загружается…' : 'Загрузить'}
                  </Button>
                  <Input
                    value={form.portrait_url}
                    onChange={e => setForm(f => ({ ...f, portrait_url: e.target.value }))}
                    placeholder="или URL изображения"
                    className="text-xs h-7"
                  />
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="npc-name">Имя *</Label>
              <Input
                id="npc-name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                maxLength={100}
              />
            </div>

            {/* Map position picker */}
            <div className="space-y-2">
              <Label>Позиция на карте</Label>
              <p className="text-xs text-muted-foreground">Кликните на карте чтобы установить позицию, или введите вручную.</p>
              <div
                ref={mapPickerRef}
                className="relative cursor-crosshair rounded-md overflow-hidden border border-border select-none"
                style={{ maxWidth: 400, aspectRatio: '16/9' }}
                onClick={handleMapClick}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/map/settlement.png" alt="Карта" className="w-full h-full object-cover" draggable={false} />
                {/* Position marker */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${form.position_x}%`,
                    top: `${form.position_y}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div style={{
                    width: 14, height: 20,
                    background: '#f5c842',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(-45deg)',
                    border: '2px solid #3a2e00',
                  }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="pos-x" className="text-xs">X (%)</Label>
                  <Input
                    id="pos-x"
                    type="number"
                    min={0}
                    max={100}
                    value={form.position_x}
                    onChange={e => setForm(f => ({ ...f, position_x: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pos-y" className="text-xs">Y (%)</Label>
                  <Input
                    id="pos-y"
                    type="number"
                    min={0}
                    max={100}
                    value={form.position_y}
                    onChange={e => setForm(f => ({ ...f, position_y: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Sort order + active */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="npc-order">Порядок</Label>
                <Input
                  id="npc-order"
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="npc-active">Активен</Label>
                <div className="flex items-center h-9">
                  <input
                    id="npc-active"
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
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить персонажа?</AlertDialogTitle>
            <AlertDialogDescription>
              Связанные квесты останутся без NPC. Это действие необратимо.
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
