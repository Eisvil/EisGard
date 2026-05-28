import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export type AdminContext = {
  supabase: AnyClient;
  userId: string;
  role: string;
};

export async function requireAdmin(
  allowedRoles: string[] = ['admin', 'moderator'],
): Promise<AdminContext | NextResponse> {
  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Требуется авторизация' } },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: { role: string } | null };

  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Недостаточно прав' } },
      { status: 403 },
    );
  }

  return { supabase, userId: user.id, role: profile.role };
}
