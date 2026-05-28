'use client';

import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
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

type App = {
  id: string;
  quantity: number;
  actual_qty: number | null;
  contact_phone: string | null;
  contact_telegram: string | null;
  comment: string | null;
  status: string;
  points_awarded: number;
  admin_note: string | null;
  created_at: string;
  profiles: { full_name: string } | null;
  materials: { name: string; unit: string } | null;
  objects: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  contacted: 'Связались',
  not_contacted: 'Не связались',
  received: 'Получено',
  cancelled: 'Отменена',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  contacted: 'default',
  not_contacted: 'outline',
  received: 'outline',
  cancelled: 'destructive',
};

export function MaterialAppsManager() {
  const [apps, setApps] = useState<App[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog «Получено»
  const [receiveApp, setReceiveApp] = useState<App | null>(null);
  const [actualQty, setActualQty] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState('');
  const [receiving, setReceiving] = useState(false);
  const [receiveSuccess, setReceiveSuccess] = useState<{ points: number } | null>(null);
  const [receiveError, setReceiveError] = useState('');

  const PER_PAGE = 20;

  const fetchApps = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(p), per_page: String(PER_PAGE) });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const res = await fetch(`/api/admin/material-applications?${params}`);
    if (!res.ok) { setError('Не удалось загрузить заявки'); setLoading(false); return; }
    const json = await res.json();
    setApps(json.data ?? []);
    setTotal(json.meta?.total ?? 0);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { setPage(1); fetchApps(1); }, [statusFilter, fetchApps]);

  async function patchStatus(app: App, status: string) {
    setActionLoading(app.id + '_' + status);
    const res = await fetch(`/api/admin/material-applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setActionLoading(null);
    if (res.ok) fetchApps(page);
  }

  async function handleReceiveSubmit() {
    if (!receiveApp) return;
    const qty = parseFloat(actualQty);
    if (!qty || qty <= 0) { setReceiveError('Укажите фактическое количество'); return; }
    setReceiving(true);
    setReceiveError('');
    const res = await fetch(`/api/admin/material-applications/${receiveApp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'received',
        actual_qty: qty,
        points_awarded: parseInt(pointsAwarded || '0', 10),
      }),
    });
    const json = await res.json();
    setReceiving(false);
    if (!res.ok) { setReceiveError(json.error?.message ?? 'Ошибка'); return; }
    setReceiveSuccess({ points: json.data?.points_awarded ?? 0 });
    fetchApps(page);
  }

  function closeReceiveDialog() {
    setReceiveApp(null);
    setActualQty('');
    setPointsAwarded('');
    setReceiveError('');
    setReceiveSuccess(null);
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Заявки на материалы</h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="contacted">Связались</SelectItem>
            <SelectItem value="not_contacted">Не связались</SelectItem>
            <SelectItem value="received">Получено</SelectItem>
            <SelectItem value="cancelled">Отменена</SelectItem>
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
              <TableHead>Материал</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Кол-во</TableHead>
              <TableHead>Контакт</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Загрузка…
                </TableCell>
              </TableRow>
            ) : apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                    {app.materials?.name ?? '—'}
                    <div className="text-xs text-muted-foreground">
                      {app.materials?.unit}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{app.objects?.name ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    {app.actual_qty != null
                      ? `${app.actual_qty} / ${app.quantity}`
                      : app.quantity}
                    {app.materials?.unit && <span className="text-xs text-muted-foreground ml-1">{app.materials.unit}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {app.contact_phone ?? app.contact_telegram ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status] ?? 'secondary'}>
                      {STATUS_LABEL[app.status] ?? app.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      {app.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={actionLoading === app.id + '_contacted'}
                            onClick={() => patchStatus(app, 'contacted')}
                          >
                            Связались
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-muted-foreground"
                            disabled={actionLoading === app.id + '_not_contacted'}
                            onClick={() => patchStatus(app, 'not_contacted')}
                          >
                            Не связались
                          </Button>
                        </>
                      )}
                      {(app.status === 'contacted' || app.status === 'not_contacted') && (
                        <>
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReceiveApp(app);
                              setActualQty(String(app.quantity));
                              setPointsAwarded('');
                              setReceiveError('');
                              setReceiveSuccess(null);
                            }}
                          >
                            Получено
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-destructive hover:text-destructive"
                            disabled={actionLoading === app.id + '_cancelled'}
                            onClick={() => patchStatus(app, 'cancelled')}
                          >
                            Отмена
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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

      {/* Dialog «Получено» */}
      <Dialog open={!!receiveApp} onOpenChange={(o) => !o && closeReceiveDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Материалы получены</DialogTitle>
          </DialogHeader>
          {receiveSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-medium">Заявка закрыта</p>
              {receiveSuccess.points > 0 && (
                <p className="text-sm text-muted-foreground">
                  Начислено баллов: <strong>{receiveSuccess.points}</strong>
                </p>
              )}
              <Button onClick={closeReceiveDialog}>Закрыть</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <p className="text-sm text-muted-foreground">
                  {receiveApp?.profiles?.full_name} · {receiveApp?.materials?.name}
                </p>
                <div>
                  <Label htmlFor="actual_qty" className="text-sm">
                    Фактическое кол-во ({receiveApp?.materials?.unit})
                  </Label>
                  <Input
                    id="actual_qty"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={actualQty}
                    onChange={(e) => setActualQty(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="points_awarded" className="text-sm">
                    Начислить баллов
                  </Label>
                  <Input
                    id="points_awarded"
                    type="number"
                    min="0"
                    value={pointsAwarded}
                    onChange={(e) => setPointsAwarded(e.target.value)}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                {receiveError && (
                  <Alert variant="destructive">
                    <AlertDescription>{receiveError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeReceiveDialog}>Отмена</Button>
                <Button disabled={receiving} onClick={handleReceiveSubmit}>
                  {receiving ? 'Сохраняем…' : 'Подтвердить'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
