'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, PenLine, RefreshCw } from 'lucide-react';
import ManualDonationDialog from './ManualDonationDialog';
import { formatMoney } from '@/lib/utils/formatMoney';

type ObjectOption = { id: string; name: string };

type Donation = {
  id: string;
  amount_kopecks: number;
  display_name: string;
  is_anonymous: boolean;
  source: string;
  status: string;
  points_awarded: number;
  confirmed_at: string | null;
  created_at: string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
  objects: { name: string; slug: string } | null;
  slots: { name: string } | null;
};

type Meta = { total: number; page: number; per_page: number };

const SOURCE_LABELS: Record<string, string> = {
  ymoney: 'ЮMoney',
  tbank: 'Т-Банк',
  sber: 'Сбербанк',
  manual: 'Наличные',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Подтверждён',
  failed: 'Ошибка',
  refunded: 'Возврат',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  failed: 'destructive',
  refunded: 'outline',
};

function formatDT(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function DonationsTable({
  initialDonations,
  initialMeta,
  objects,
}: {
  initialDonations: Donation[];
  initialMeta: Meta;
  objects: ObjectOption[];
}) {
  const [donations, setDonations] = useState<Donation[]>(initialDonations);
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [objectFilter, setObjectFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const fetchDonations = useCallback(async (
    p: number,
    status: string,
    source: string,
    objectId: string,
  ) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), per_page: '20' });
    if (status) params.set('status', status);
    if (source) params.set('source', source);
    if (objectId) params.set('object_id', objectId);
    try {
      const res = await fetch(`/api/admin/donations?${params}`);
      const j = await res.json();
      setDonations(j.data ?? []);
      setMeta(j.meta ?? { total: 0, page: p, per_page: 20 });
    } finally {
      setLoading(false);
    }
  }, []);

  function applyFilters() {
    setPage(1);
    fetchDonations(1, statusFilter, sourceFilter, objectFilter);
  }

  function handlePageChange(p: number) {
    setPage(p);
    fetchDonations(p, statusFilter, sourceFilter, objectFilter);
  }

  const totalPages = Math.ceil(meta.total / meta.per_page);

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-36">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger><SelectValue placeholder="Источник" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все источники</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Статус" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-44">
          <Select value={objectFilter} onValueChange={setObjectFilter}>
            <SelectTrigger><SelectValue placeholder="Объект" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все объекты</SelectItem>
              {objects.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={applyFilters}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Применить
        </Button>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setManualOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Добавить вручную
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">Всего: {meta.total}</p>

      {donations.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">
          Пожертвований нет
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Даритель</TableHead>
                <TableHead>Объект / Слот</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead className="text-center">Баллы</TableHead>
                <TableHead className="text-center">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDT(d.confirmed_at ?? d.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {d.source !== 'ymoney' && (
                        <PenLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label="Ручной донат" />
                      )}
                      <span className="text-sm">
                        {d.is_anonymous ? 'Аноним' : (d.profiles?.full_name || d.display_name)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{d.objects?.name ?? '—'}</div>
                    {d.slots?.name && (
                      <div className="text-xs text-muted-foreground">{d.slots.name}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {SOURCE_LABELS[d.source] ?? d.source}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(d.amount_kopecks)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {d.points_awarded > 0 ? `+${d.points_awarded}` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={STATUS_VARIANT[d.status] ?? 'outline'}>
                      {STATUS_LABELS[d.status] ?? d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => handlePageChange(page - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => handlePageChange(page + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}

      <ManualDonationDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        objects={objects}
        onCreated={() => fetchDonations(1, statusFilter, sourceFilter, objectFilter)}
      />
    </div>
  );
}
