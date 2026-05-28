import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServiceSupabaseClient } from '@/lib/supabase/server';
import UsersTable, { type UserRow } from '@/components/features/admin/UsersTable';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

export default async function AdminUsersPage() {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return null;
  const { userId } = ctx;

  const supabase = (await createServiceSupabaseClient()) as unknown as AnyClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [usersResult, countResult] = await Promise.all([
    db.rpc('get_users_with_email', {
      p_limit: 50,
      p_offset: 0,
      p_search: null,
      p_role: null,
    }),
    db.rpc('count_users', {
      p_search: null,
      p_role: null,
    }),
  ]);

  const initialUsers = (usersResult.data ?? []) as UserRow[];
  const initialMeta = {
    total: Number(countResult.data ?? 0),
    page: 1,
    per_page: 50,
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Управление ролями участников проекта
        </p>
      </div>
      <UsersTable
        initialUsers={initialUsers}
        initialMeta={initialMeta}
        currentUserId={userId}
      />
    </div>
  );
}
