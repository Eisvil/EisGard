'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2 } from 'lucide-react';

type Material = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  needed_qty: number;
  received_qty: number;
  is_active: boolean;
  sort_order: number;
  pending_apps_count: number;
  objects: { name: string } | null;
};

type ObjectOption = { id: string; name: string };

type FormState = {
  name: string;
  description: string;
  unit: string;
  needed_qty: string;
  object_id: string;
  sort_order: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  unit: 'шт',
  needed_qty: '',
  object_id: 'none',
  sort_order: '0',
};

type Props = { objects?: ObjectOption[] };

export function MaterialsManager({ objects: initialObjects }: Props) {
  const [objects, setObjects] = useState<ObjectOption[]>(initialObjects ?? []);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialObjects) return;
    fetch('/api/admin/objects')
      .then(r => r.json())
      .then(j => setObjects((j.data ?? []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name }))))
      .catch(() => {});
  }, [initialObjects]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/materials?with_apps=true');
    const json = await res.json();
    setMaterials(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setDialogOpen(true);
  }

  function openEdit(m: Material) {
    setEditing(m);
    setForm({
      name: m.name,
      description: m.description ?? '',
      unit: m.unit,
      needed_qty: String(m.needed_qty),
      object_id: objects.find(o => o.name === m.objects?.name)?.id ?? 'none',
      sort_order: String(m.sort_order),
    });
    setFormError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setFormError('');
    const neededQty = parseFloat(form.needed_qty);
    if (!form.name.trim() || isNaN(neededQty) || neededQty <= 0) {
      setFormError('Заполните обязательные поля корректно');
      setSaving(false);
      return;
    }
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unit: form.unit,
      needed_qty: neededQty,
      object_id: form.object_id !== 'none' ? form.object_id : null,
      sort_order: parseInt(form.sort_order || '0', 10),
    };

    const url = editing ? `/api/admin/materials/${editing.id}` : '/api/admin/materials';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) { setFormError(json.error?.message ?? 'Ошибка'); setSaving(false); return; }
    setDialogOpen(false);
    fetchMaterials();
    setSaving(false);
  }

  async function handleToggleActive(m: Material) {
    await fetch(`/api/admin/materials/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !m.is_active }),
    });
    setMaterials(prev => prev.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    const res = await fetch(`/api/admin/materials/${deleteTarget.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) { setDeleteError(json.error?.message ?? 'Ошибка'); setDeleting(false); return; }
    setDeleteTarget(null);
    fetchMaterials();
    setDeleting(false);
  }

  const percent = (m: Material) =>
    m.needed_qty > 0 ? Math.min(100, Math.round((m.received_qty / m.needed_qty) * 100)) : 0;

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{materials.length} материалов</span>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus size={14} /> Добавить материал
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Материал</TableHead>
            <TableHead>Объект</TableHead>
            <TableHead>Прогресс</TableHead>
            <TableHead>Заявок</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Загрузка...</TableCell>
            </TableRow>
          )}
          {!loading && materials.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Материалов нет</TableCell>
            </TableRow>
          )}
          {materials.map(m => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.unit}</div>
              </TableCell>
              <TableCell className="text-sm">{m.objects?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                <div className="text-sm">{m.received_qty} / {m.needed_qty} {m.unit}</div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden w-24">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent(m)}%` }} />
                </div>
              </TableCell>
              <TableCell>
                {m.pending_apps_count > 0 ? (
                  <Badge variant="secondary">{m.pending_apps_count} ожидает</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <button
                  onClick={() => handleToggleActive(m)}
                  className="cursor-pointer"
                >
                  <Badge variant={m.is_active ? 'default' : 'outline'}>
                    {m.is_active ? 'Активен' : 'Неактивен'}
                  </Badge>
                </button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => { setDeleteTarget(m); setDeleteError(''); }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать материал' : 'Новый материал'}</DialogTitle>
          </DialogHeader>
          {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
          <div className="space-y-3 py-1">
            <div>
              <Label>Название *</Label>
              <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Нужно *</Label>
                <Input className="mt-1" type="number" min="0.01" step="0.01" value={form.needed_qty}
                  onChange={e => setForm(f => ({ ...f, needed_qty: e.target.value }))} />
              </div>
              <div>
                <Label>Единица</Label>
                <Input className="mt-1" value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Объект</Label>
              <Select value={form.object_id} onValueChange={v => setForm(f => ({ ...f, object_id: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Не привязан" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Не привязан —</SelectItem>
                  {objects.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea className="mt-1" rows={2} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Сохраняю...' : 'Сохранить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить материал?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.name}» будет удалён. Это действие нельзя отменить.
              {deleteTarget?.pending_apps_count ? ` Есть ${deleteTarget.pending_apps_count} незакрытых заявок.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive px-1">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Удаляю...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
