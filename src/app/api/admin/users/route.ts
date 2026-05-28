import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/requireAdmin';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

type AnyClient = ReturnType<typeof import('@/lib/supabase/server')['createServerSupabaseClient']> extends Promise<infer T> ? T : never;

export async function GET(request: Request) {
  const ctx = await requireAdmin(['admin']);
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const perPage = 50;
  const search = searchParams.get('search') ?? undefined;
  const role = searchParams.get('role') ?? undefined;
  const offset = (page - 1) * perPage;

  // Service role — нужен для SECURITY DEFINER RPC через service role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createServiceSupabaseClient()) as any;

  const [usersResult, countResult] = await Promise.all([
    supabase.rpc('get_users_with_email', {
      p_limit: perPage,
      p_offset: offset,
      p_search: search ?? null,
      p_role: role ?? null,
    }),
    supabase.rpc('count_users', {
      p_search: search ?? null,
      p_role: role ?? null,
    }),
  ]);

  if (usersResult.error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Ошибка загрузки пользователей' } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: usersResult.data ?? [],
    meta: {
      total: Number(countResult.data ?? 0),
      page,
      per_page: perPage,
    },
  });
}
