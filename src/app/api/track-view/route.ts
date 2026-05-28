import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function POST(req: NextRequest) {
  let body: { object_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { object_id } = body;
  if (!object_id || typeof object_id !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);

  const supabase = (await createServerSupabaseClient()) as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('object_views').insert({
    object_id,
    ip_hash: ipHash,
    user_id: user?.id ?? null,
  });

  return NextResponse.json({ ok: true });
}
