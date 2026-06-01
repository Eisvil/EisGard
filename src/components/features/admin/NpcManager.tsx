'use client';

import { useCallback, useRef, useState } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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

// ─── Crop helpers (same as AvatarUploader) ───────────────────────────────────

function centerSquareCrop(width: number, height: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
    width,
    height,
  );
}

async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  ctx.drawImage(
    image,
    Math.round(crop.x * scaleX),
    Math.round(crop.y * scaleY),
    Math.round(crop.width * scaleX),
    Math.round(crop.height * scaleY),
    0, 0, size, size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

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

  // Crop state
  const [cropImgSrc, setCropImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const cropImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Open file picker → read as data URL → show crop modal
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 5 МБ)');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropImgSrc(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const onCropImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerSquareCrop(width, height));
  }, []);

  async function handleCropConfirm() {
    if (!cropImgRef.current || !completedCrop) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedBlob(cropImgRef.current, completedCrop);
      const supabase = createBrowserSupabaseClient();
      const path = `npcs/${editingId ?? 'new'}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) { setError('Ошибка загрузки: ' + uploadError.message); return; }
      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(path);
      setForm(f => ({ ...f, portrait_url: publicUrl }));
      setCropImgSrc(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  }

  function handleCropCancel() {
    setCropImgSrc(null);
    setError('');
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
                    onChange={handleFileChange}
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

            {/* Position */}
            <div className="space-y-2">
              <Label>Начальная позиция</Label>
              <p className="text-xs text-muted-foreground">
                Для точного размещения используйте раздел <strong>Карта</strong> — там NPC можно перетащить на нужное место.
              </p>
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

      {/* Crop modal — rendered outside Dialog to avoid z-index conflicts */}
      {cropImgSrc && (
        <div className="crop-modal-overlay" style={{ zIndex: 1300 }} onClick={handleCropCancel}>
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="crop-modal-title">Выбрать область портрета</h3>
            <p className="crop-modal-hint">Перетащите и измените размер квадрата</p>

            <div className="crop-modal-canvas">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
                keepSelection
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={cropImgRef}
                  src={cropImgSrc}
                  alt="Кроп портрета"
                  onLoad={onCropImageLoad}
                  style={{ maxHeight: '60vh', maxWidth: '100%' }}
                />
              </ReactCrop>
            </div>

            {error && <p className="cert-error">{error}</p>}

            <div className="crop-modal-actions">
              <button
                className="primary-button"
                onClick={handleCropConfirm}
                disabled={uploading || !completedCrop}
              >
                {uploading ? 'Загружается…' : 'Сохранить портрет'}
              </button>
              <button
                className="text-link"
                onClick={handleCropCancel}
                disabled={uploading}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

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
