'use client';

import { useState } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, MousePointerClick } from 'lucide-react';

interface TutorialStepRow {
  id: string;
  step_index: number;
  sort_order: number;
  title: string;
  text: string;
  selector: string | null;
  interactive: boolean;
  is_active: boolean;
}

interface Props {
  initialSteps: TutorialStepRow[];
}

export default function TutorialStepsManager({ initialSteps }: Props) {
  const [steps, setSteps] = useState(initialSteps);
  const [editing, setEditing] = useState<TutorialStepRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const openEdit = (step: TutorialStepRow) => {
    setEditing({ ...step });
    setError('');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.text.trim()) {
      setError('Заголовок и текст обязательны');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/tutorial-steps/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editing.title.trim(), text: editing.text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Ошибка сохранения');
      setSteps((prev) => prev.map((s) => s.id === editing.id ? { ...s, title: editing.title, text: editing.text } : s));
      setEditing(null);
      showToast('Шаг сохранён');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Редактируйте заголовок и текст каждого шага туториала. Порядок, селекторы и интерактивность
        управляются в коде.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Заголовок</TableHead>
            <TableHead className="hidden md:table-cell">Превью текста</TableHead>
            <TableHead className="w-24">Тип</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {steps.map((step) => (
            <TableRow key={step.id}>
              <TableCell className="font-mono text-muted-foreground">{step.sort_order + 1}</TableCell>
              <TableCell className="font-medium">{step.title}</TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-xs truncate">
                {step.text}
              </TableCell>
              <TableCell>
                {step.interactive ? (
                  <Badge variant="secondary" className="gap-1">
                    <MousePointerClick size={12} />
                    Интерактивный
                  </Badge>
                ) : step.selector ? (
                  <Badge variant="outline">Spotlight</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Диалог</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => openEdit(step)}>
                  <Pencil size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать шаг {editing ? editing.sort_order + 1 : ''}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step-title">Заголовок</Label>
                <Input
                  id="step-title"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="step-text">Текст NPC</Label>
                <Textarea
                  id="step-text"
                  value={editing.text}
                  onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">{editing.text.length}/1000 символов</p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
