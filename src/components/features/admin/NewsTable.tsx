'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type NewsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  tag: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

type NewsTableProps = {
  rows: NewsRow[];
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NewsTable({ rows: initialRows }: NewsTableProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function togglePublish(row: NewsRow) {
    setLoadingId(row.id);
    try {
      await fetch(`/api/admin/news/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !row.published }),
      });
      setRows(prev => prev.map(r =>
        r.id === row.id
          ? { ...r, published: !r.published, published_at: !r.published ? new Date().toISOString() : null }
          : r
      ));
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
      setRows(prev => prev.filter(r => r.id !== id));
    } finally {
      setLoadingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center text-sm">
        Новостей нет. <Button variant="link" onClick={() => router.push('/admin/news/new')}>Создать первую</Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Обложка</TableHead>
          <TableHead>Заголовок</TableHead>
          <TableHead className="w-28">Тег</TableHead>
          <TableHead className="w-28">Статус</TableHead>
          <TableHead className="w-36">Дата</TableHead>
          <TableHead className="w-48 text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              {row.cover_url
                ? <img src={row.cover_url} alt="" className="h-12 w-12 rounded object-cover" />
                : <div className="h-12 w-12 rounded bg-muted" />
              }
            </TableCell>
            <TableCell>
              <div className="font-medium">{row.title}</div>
              <div className="text-xs text-muted-foreground">{row.slug}</div>
            </TableCell>
            <TableCell>
              {row.tag ? <Badge variant="outline">{row.tag}</Badge> : '—'}
            </TableCell>
            <TableCell>
              <Badge variant={row.published ? 'default' : 'secondary'}>
                {row.published ? 'Опубликована' : 'Черновик'}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(row.published ? row.published_at : row.created_at)}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/admin/news/${row.id}/edit`)}
                >
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingId === row.id}
                  onClick={() => togglePublish(row)}
                >
                  {row.published ? 'Снять' : 'Опубликовать'}
                </Button>
                {!row.published && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        Удалить
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить новость?</AlertDialogTitle>
                        <AlertDialogDescription>
                          «{row.title}» будет удалена без возможности восстановления.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(row.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
