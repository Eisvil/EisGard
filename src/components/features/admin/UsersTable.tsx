'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  points: number;
  title_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type Meta = { total: number; page: number; per_page: number };

const ROLE_LABELS: Record<string, string> = {
  user: 'Участник',
  moderator: 'Модератор',
  admin: 'Администратор',
};

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  user: 'outline',
  moderator: 'secondary',
  admin: 'default',
};

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UsersTable({
  initialUsers,
  initialMeta,
  currentUserId,
}: {
  initialUsers: UserRow[];
  initialMeta: Meta;
  currentUserId: string;
}) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (p: number, q: string, role: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q.trim()) params.set('search', q.trim());
    if (role && role !== 'all') params.set('role', role);
    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const j = await res.json();
      setUsers(j.data ?? []);
      setMeta(j.meta ?? { total: 0, page: p, per_page: 50 });
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchUsers(1, val, roleFilter);
    }, 300);
  }

  function handleRoleFilterChange(val: string) {
    setRoleFilter(val);
    setPage(1);
    fetchUsers(1, search, val);
  }

  function handlePageChange(p: number) {
    setPage(p);
    fetchUsers(p, search, roleFilter);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setRoleLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
        toast.success('Роль изменена');
      } else {
        const j = await res.json();
        toast.error(j?.error?.message ?? 'Ошибка изменения роли');
      }
    } finally {
      setRoleLoadingId(null);
    }
  }

  const totalPages = Math.ceil(meta.total / meta.per_page);

  return (
    <div className="space-y-4">
      {/* Поиск и фильтр */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по имени или email..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger><SelectValue placeholder="Все роли" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="user">Участники</SelectItem>
              <SelectItem value="moderator">Модераторы</SelectItem>
              <SelectItem value="admin">Администраторы</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="ml-auto text-sm text-muted-foreground">
          {loading ? 'Загрузка...' : `${meta.total} пользователей`}
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">
          Пользователи не найдены
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Участник</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="text-center">Баллы</TableHead>
                <TableHead>Титул</TableHead>
                <TableHead>Зарегистрирован</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isMe = u.id === currentUserId;
                const isAdmin = u.role === 'admin';
                const canEdit = !isMe && !isAdmin;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {u.full_name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium">{u.full_name}</span>
                        {isMe && (
                          <Badge variant="outline" className="text-xs">Вы</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <Select
                          value={u.role}
                          disabled={roleLoadingId === u.id}
                          onValueChange={(val) => handleRoleChange(u.id, val)}
                        >
                          <SelectTrigger className="w-36 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Участник</SelectItem>
                            <SelectItem value="moderator">Модератор</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={ROLE_VARIANT[u.role] ?? 'outline'}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {u.points.toLocaleString('ru-RU')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.title_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
