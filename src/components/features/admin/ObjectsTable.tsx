'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { formatMoney } from '@/lib/utils/formatMoney';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { OBJECT_STATUS } from '@/lib/constants/objectStatus';
import { ZONE_LABELS } from '@/lib/constants/zones';
import type { ZoneKey } from '@/lib/constants/zones';

type ObjectRow = {
  id: string;
  slug: string;
  name: string;
  zone: string;
  status: string;
  sort_order: number;
  total_goal_rub: number;
  total_raised_rub: number;
  created_at: string;
};

type Props = { objects: ObjectRow[] };

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft:    'secondary',
  planned:  'outline',
  building: 'default',
  done:     'default',
  working:  'default',
};

function percent(raised: number, goal: number) {
  if (!goal) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

export function ObjectsTable({ objects }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<ObjectRow[]>(objects);

  async function handleDelete(id: string, slug: string) {
    void slug;
    const res = await fetch(`/api/admin/objects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRows((prev) => prev.filter((o) => o.id !== id));
      toast.success('Объект удалён');
      router.refresh();
    } else {
      toast.error('Не удалось удалить объект');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Объекты</h1>
        <Button asChild size="sm">
          <Link href="/admin/objects/new">
            <Plus size={14} className="mr-1.5" /> Создать объект
          </Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          Объектов нет.{' '}
          <Link href="/admin/objects/new" className="underline hover:text-foreground">
            Создать первый
          </Link>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Зона</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Сбор</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((obj) => {
                const statusInfo = OBJECT_STATUS[obj.status as keyof typeof OBJECT_STATUS];
                const pct        = percent(obj.total_raised_rub, obj.total_goal_rub);
                const zoneLabel  = ZONE_LABELS[obj.zone as ZoneKey] ?? obj.zone;

                return (
                  <TableRow key={obj.id}>
                    <TableCell>
                      <Link
                        href={`/admin/objects/${obj.id}`}
                        className="font-medium hover:underline"
                      >
                        {obj.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">/{obj.slug}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{zoneLabel}</TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[obj.status] ?? 'outline'}
                        style={{ borderColor: statusInfo?.color, color: statusInfo?.color }}
                      >
                        {statusInfo?.label ?? obj.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {obj.total_goal_rub > 0 ? (
                        <span title={`${formatMoney(obj.total_raised_rub)} из ${formatMoney(obj.total_goal_rub)}`}>
                          {pct}% · {formatMoney(obj.total_raised_rub)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Link href={`/admin/objects/${obj.id}`}>
                            <Pencil size={13} />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Удалить «{obj.name}»?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Объект и все его слоты будут удалены безвозвратно.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(obj.id, obj.slug)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Удалить
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
