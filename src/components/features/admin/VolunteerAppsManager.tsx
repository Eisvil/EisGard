'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Camp = { id: string; name: string; date_from: string; date_to: string };

type App = {
  id: string;
  status: string;
  days_worked: number | null;
  points_awarded: number;
  admin_note: string | null;
  comment: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  volunteer_camps: { id: string; name: string; date_from: string; date_to: string } | null;
  objects: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрена',
  rejected: 'Отклонена',
  completed: 'Завершена',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  completed: 'outline',
};

export function VolunteerAppsManager({ initialCamps }: { initialCamps: Camp[] }) {
  const [apps, setApps] = useState<App[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [campFilter, setCampFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Complete dialog
  const [completeApp, setCompleteApp] = useState<App | null>(null);
  const [daysWorked, setDaysWorked] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState<{ points: number } | null>(null);
  const [completeError, setCompleteError] = useState('');

  // Reject dialog
  const [rejectApp, setRejectApp] = useState<App | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const PER_PAGE = 20;

  const fetchApps = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE) });
    if (campFilter !== 'all') params.set('camp_id', campFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/admin/volunteer-applications?${params}`);
    if (!res.ok) { setError('Не удалось загрузить заявки'); setLoading(false); return; }
    const json = await res.json();
    setApps(json.data ?? []);
    setTotal(json.meta?.total ?? 0);
    setLoading(false);
  }, [campFilter, statusFilter]);

  useEffect(() => { setPage(1); fetchApps(1); }, [campFilter, statusFilter, fetchApps]);

  async function handleApprove(app: App) {
    setActionLoading(app.id + '_approve');
    const res = await fetch(`/api/admin/volunteer-applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });
    setActionLoading(null);
    if (res.ok) fetchApps(page);
  }

  async function handleRejectConfirm() {
    if (!rejectApp) return;
    setRejecting(true);
    const res = await fetch(`/api/admin/volunteer-applications/${rejectApp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', admin_note: rejectNote || undefined }),
    });
    setRejecting(false);
    setRejectApp(null);
    setRejectNote('');
    if (res.ok) fetchApps(page);
  }

  async function handleCompleteSubmit() {
    if (!completeApp) return;
    const days = parseInt(daysWorked, 10);
    if (!days || days < 1) { setCompleteError('Введите корректное число дней'); return; }
    setCompleting(true);
    setCompleteError('');
    const res = await fetch(`/api/admin/volunteer-applications/${completeApp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', days_worked: days }),
    });
    const json = await res.json();
    setCompleting(false);
    if (!res.ok) {
      setCompleteError(json.error?.message ?? 'Ошибка');
      return;
    }
    setCompleteSuccess({ points: json.data?.points_awarded ?? 0 });
    fetchApps(page);
  }

  function closeCompleteDialog() {
    setCompleteApp(null);
    setDaysWorked('');
    setCompleteError('');
    setCompleteSuccess(null);
  }

  const maxDays = completeApp?.volunteer_camps
    ? Math.round(
        (new Date(completeApp.volunteer_camps.date_to).getTime() -
          new Date(completeApp.volunteer_camps.date_from).getTime()) /
          86400000,
      ) + 1
    : undefined;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Волонтёрские заявки</h1>
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={campFilter} onValueChange={setCampFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Все заезды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все заезды</SelectItem>
            {initialCamps.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} ({c.date_from})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">На рассмотрении</SelectItem>
            <SelectItem value="approved">Одобрены</SelectItem>
            <SelectItem value="rejected">Отклонены</SelectItem>
            <SelectItem value="completed">Завершены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-muted-foreground mb-2">Всего: {total}</div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Участник</TableHead>
              <TableHead>Заезд</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дни / Баллы</TableHead>
              <TableHead>Дата подачи</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Заявок нет
                </TableCell>
              </TableRow>
            ) : (
              apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.profiles?.full_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {app.volunteer_camps?.name ?? '—'}
                    {app.volunteer_camps && (
                      <div className="text-xs text-muted-foreground">
                        {app.volunteer_camps.date_from} – {app.volunteer_camps.date_to}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{app.objects?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status] ?? 'secondary'}>
                      {STATUS_LABEL[app.status] ?? app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {app.days_worked != null ? `${app.days_worked} д` : '—'}
                    {app.points_awarded > 0 && (
                      <div className="text-xs text-muted-foreground">+{app.points_awarded} б</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={actionLoading === app.id + '_approve'}
                            onClick={() => handleApprove(app)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            onClick={() => { setRejectApp(app); setRejectNote(''); }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      {app.status === 'approved' && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setCompleteApp(app); setDaysWorked(''); setCompleteError(''); setCompleteSuccess(null); }}
                        >
                          <Award className="h-3.5 w-3.5 mr-1" />
                          Завершить
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => { const p = page - 1; setPage(p); fetchApps(p); }}
          >
            ← Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Стр. {page} из {Math.ceil(total / PER_PAGE)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / PER_PAGE)}
            onClick={() => { const p = page + 1; setPage(p); fetchApps(p); }}
          >
            Вперёд →
          </Button>
        </div>
      )}

      {/* Dialog завершения */}
      <Dialog open={!!completeApp} onOpenChange={(o) => !o && closeCompleteDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Завершить заявку</DialogTitle>
          </DialogHeader>
          {completeSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium">Заявка завершена</p>
              <p className="text-sm text-muted-foreground">
                Начислено баллов: <strong>{completeSuccess.points}</strong>
              </p>
              <Button onClick={closeCompleteDialog}>Закрыть</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Участник:{' '}
                  <strong>{completeApp?.profiles?.full_name}</strong>
                  {maxDays !== undefined && (
                    <> · Заезд: <strong>{maxDays} дн.</strong></>
                  )}
                </p>
                <div>
                  <Label htmlFor="days_worked" className="text-sm">
                    Отработано дней{maxDays !== undefined && ` (макс. ${maxDays})`}
                  </Label>
                  <Input
                    id="days_worked"
                    type="number"
                    min={1}
                    max={maxDays}
                    value={daysWorked}
                    onChange={(e) => setDaysWorked(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {completeError && (
                  <Alert variant="destructive">
                    <AlertDescription>{completeError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCompleteDialog}>Отмена</Button>
                <Button disabled={completing} onClick={handleCompleteSubmit}>
                  {completing ? 'Сохраняем…' : 'Подтвердить'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* AlertDialog отклонения */}
      <AlertDialog open={!!rejectApp} onOpenChange={(o) => !o && setRejectApp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка участника{' '}
              <strong>{rejectApp?.profiles?.full_name}</strong> будет отклонена.
              <div className="mt-2">
                <Label className="text-sm">Причина (необязательно)</Label>
                <Input
                  className="mt-1"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Комментарий…"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={rejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRejectConfirm}
            >
              {rejecting ? 'Отклоняем…' : 'Отклонить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
