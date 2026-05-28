'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Globe } from 'lucide-react';

type App = {
  id: string;
  org_name: string;
  inn: string | null;
  support_type: string;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  status: string;
  logo_url: string | null;
  admin_note: string | null;
  created_at: string;
  objects: { name: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Ожидает',
  contacted: 'Связались',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  contacted: 'default',
  approved: 'default',
  rejected: 'destructive',
};

const SUPPORT_LABEL: Record<string, string> = {
  money: 'Деньги',
  materials: 'Материалы',
  services: 'Услуги',
  complex: 'Комплексная',
};

type Props = { initialApps?: App[] };

export function PartnerAppsManager({ initialApps }: Props) {
  const [apps, setApps] = useState<App[]>(initialApps ?? []);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(!initialApps);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialApps) return;
    fetch('/api/admin/partner-applications?per_page=200')
      .then(r => r.json())
      .then(j => { setApps(j.data ?? []); setLoading(false); })
      .catch(() => { setError('Не удалось загрузить заявки'); setLoading(false); });
  }, [initialApps]);

  // Approve dialog state
  const [approveApp, setApproveApp] = useState<App | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [publishPartner, setPublishPartner] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [approveSuccess, setApproveSuccess] = useState(false);

  // Reject dialog
  const [rejectApp, setRejectApp] = useState<App | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const openApprove = (app: App) => {
    setApproveApp(app);
    setLogoUrl(app.logo_url ?? '');
    setPublishPartner(true);
    setAdminNote('');
    setApproveSuccess(false);
    setError('');
  };

  const handleStatusChange = useCallback(async (id: string, status: string, extra?: Record<string, unknown>) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Ошибка');
      setApps(prev => prev.map(a => a.id === id ? { ...a, status, admin_note: (extra?.admin_note as string) ?? a.admin_note } : a));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleApprove() {
    if (!approveApp) return;
    const ok = await handleStatusChange(approveApp.id, 'approved', {
      publish_partner: publishPartner,
      logo_url: logoUrl || undefined,
      admin_note: adminNote || undefined,
    });
    if (ok) setApproveSuccess(true);
  }

  async function handleReject() {
    if (!rejectApp) return;
    const ok = await handleStatusChange(rejectApp.id, 'rejected', {
      admin_note: rejectNote || undefined,
    });
    if (ok) setRejectApp(null);
  }

  async function handleContacted(app: App) {
    await handleStatusChange(app.id, 'contacted');
  }

  const filtered = filterStatus === 'all' ? apps : apps.filter(a => a.status === filterStatus);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все заявки</SelectItem>
            <SelectItem value="pending">Ожидают</SelectItem>
            <SelectItem value="contacted">Связались</SelectItem>
            <SelectItem value="approved">Одобрены</SelectItem>
            <SelectItem value="rejected">Отклонены</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} заявок</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Организация</TableHead>
            <TableHead>Тип поддержки</TableHead>
            <TableHead>Объект</TableHead>
            <TableHead>Контакт</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Заявок нет
              </TableCell>
            </TableRow>
          )}
          {filtered.map(app => (
            <TableRow key={app.id}>
              <TableCell>
                <div className="font-medium">{app.org_name}</div>
                {app.inn && <div className="text-xs text-muted-foreground">ИНН: {app.inn}</div>}
              </TableCell>
              <TableCell>{SUPPORT_LABEL[app.support_type] ?? app.support_type}</TableCell>
              <TableCell>{app.objects?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell>
                <div className="text-sm">{app.contact_name}</div>
                <div className="text-xs text-muted-foreground">{app.contact_email}</div>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[app.status] ?? 'outline'}>
                  {STATUS_LABEL[app.status] ?? app.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(app.created_at).toLocaleDateString('ru-RU')}
              </TableCell>
              <TableCell>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleContacted(app)} disabled={loading}>
                      Связались
                    </Button>
                    <Button size="sm" onClick={() => openApprove(app)} disabled={loading}>
                      Одобрить
                    </Button>
                  </div>
                )}
                {app.status === 'contacted' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => { setRejectApp(app); setRejectNote(''); }} disabled={loading}>
                      Отклонить
                    </Button>
                    <Button size="sm" onClick={() => openApprove(app)} disabled={loading}>
                      Одобрить
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Approve dialog */}
      <Dialog open={!!approveApp} onOpenChange={open => { if (!open) { setApproveApp(null); setApproveSuccess(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Одобрить заявку</DialogTitle>
          </DialogHeader>
          {approveSuccess ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle2 className="text-green-500" size={40} />
              <p className="text-sm text-center">
                Заявка одобрена{publishPartner ? ' и партнёр опубликован' : ''}.
              </p>
              <Button onClick={() => { setApproveApp(null); setApproveSuccess(false); }}>Закрыть</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="text-sm">
                  <span className="font-medium">{approveApp?.org_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="publish-partner"
                    checked={publishPartner}
                    onChange={e => setPublishPartner(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="publish-partner" className="cursor-pointer">
                    Опубликовать как партнёра на странице проекта
                  </Label>
                </div>
                {publishPartner && (
                  <div className="space-y-1.5">
                    <Label>URL логотипа (необязательно)</Label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={e => setLogoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label>Заметка (необязательно)</Label>
                  <Textarea
                    placeholder="Внутренний комментарий..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveApp(null)}>Отмена</Button>
                <Button onClick={handleApprove} disabled={loading}>
                  {loading ? 'Сохраняю...' : 'Одобрить'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectApp} onOpenChange={open => { if (!open) setRejectApp(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectApp?.org_name} — это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Textarea
              placeholder="Причина отклонения (необязательно)..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleReject}
              disabled={loading}
            >
              Отклонить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
