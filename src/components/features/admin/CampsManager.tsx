'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Trash2, Plus, Lock, LockOpen } from 'lucide-react';

export type Camp = {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  max_volunteers: number;
  description: string | null;
  is_open: boolean;
  created_at: string | null;
  pending_count: number;
  approved_count: number;
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const emptyForm = {
  name: '',
  date_from: '',
  date_to: '',
  max_volunteers: 20,
  description: '',
};

export default function CampsManager({ initialCamps }: { initialCamps: Camp[] }) {
  const [camps, setCamps] = useState<Camp[]>(initialCamps);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Camp | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  }

  function openEdit(camp: Camp) {
    setEditing(camp);
    setForm({
      name: camp.name,
      date_from: camp.date_from,
      date_to: camp.date_to,
      max_volunteers: camp.max_volunteers,
      description: camp.description ?? '',
    });
    setError('');
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.date_from || !form.date_to) {
      setError('Заполните название и даты');
      return;
    }
    if (form.date_to < form.date_from) {
      setError('Дата окончания должна быть не раньше даты начала');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        date_from: form.date_from,
        date_to: form.date_to,
        max_volunteers: form.max_volunteers,
        description: form.description.trim() || null,
      };
      if (editing) {
        const res = await fetch(`/api/admin/camps/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json();
          setError(j?.error?.message ?? 'Ошибка сохранения');
          return;
        }
        setCamps((prev) =>
          prev.map((c) => (c.id === editing.id ? { ...c, ...payload } : c)),
        );
      } else {
        const res = await fetch('/api/admin/camps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json();
          setError(j?.error?.message ?? 'Ошибка создания');
          return;
        }
        const { data } = await res.json();
        const newCamp: Camp = {
          id: data.id,
          ...payload,
          is_open: true,
          created_at: new Date().toISOString(),
          pending_count: 0,
          approved_count: 0,
        };
        setCamps((prev) => [newCamp, ...prev]);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleOpen(camp: Camp) {
    setLoadingId(camp.id);
    try {
      const res = await fetch(`/api/admin/camps/${camp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !camp.is_open }),
      });
      if (res.ok) {
        setCamps((prev) =>
          prev.map((c) => (c.id === camp.id ? { ...c, is_open: !c.is_open } : c)),
        );
      }
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoadingId(deleteId);
    try {
      const res = await fetch(`/api/admin/camps/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json();
        alert(j?.error?.message ?? 'Ошибка удаления');
        return;
      }
      setCamps((prev) => prev.filter((c) => c.id !== deleteId));
    } finally {
      setLoadingId(null);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{camps.length} заездов</p>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" /> Создать заезд
        </Button>
      </div>

      {camps.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">
          Заездов пока нет.{' '}
          <button className="underline" onClick={openCreate}>
            Создать первый
          </button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Заезд</TableHead>
                <TableHead>Период</TableHead>
                <TableHead className="text-center">Макс</TableHead>
                <TableHead className="text-center">Подано</TableHead>
                <TableHead className="text-center">Одобрено</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {camps.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium max-w-[200px]">
                    <div className="truncate">{camp.name}</div>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(camp.date_from)} — {formatDate(camp.date_to)}
                  </TableCell>
                  <TableCell className="text-center">{camp.max_volunteers}</TableCell>
                  <TableCell className="text-center">{camp.pending_count}</TableCell>
                  <TableCell className="text-center">{camp.approved_count}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={camp.is_open ? 'default' : 'secondary'}>
                      {camp.is_open ? 'Открыт' : 'Закрыт'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={camp.is_open ? 'Закрыть набор' : 'Открыть набор'}
                        disabled={loadingId === camp.id}
                        onClick={() => handleToggleOpen(camp)}
                      >
                        {camp.is_open ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <LockOpen className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(camp)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={loadingId === camp.id}
                        onClick={() => setDeleteId(camp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Диалог создания / редактирования */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать заезд' : 'Новый заезд'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1">
              <Label htmlFor="camp-name">Название *</Label>
              <Input
                id="camp-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Летний заезд — кузница"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="camp-from">Дата начала *</Label>
                <Input
                  id="camp-from"
                  type="date"
                  value={form.date_from}
                  onChange={(e) => setForm((f) => ({ ...f, date_from: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="camp-to">Дата окончания *</Label>
                <Input
                  id="camp-to"
                  type="date"
                  value={form.date_to}
                  onChange={(e) => setForm((f) => ({ ...f, date_to: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="camp-max">Максимум участников</Label>
              <Input
                id="camp-max"
                type="number"
                min={1}
                value={form.max_volunteers}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_volunteers: parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="camp-desc">Описание</Label>
              <Textarea
                id="camp-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Чем будем заниматься..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog удаления */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заезд?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все заявки на этот заезд тоже будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
