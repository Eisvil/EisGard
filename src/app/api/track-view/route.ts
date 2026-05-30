import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function verifyInternalSecret(req: NextRequest): boolean {
  const internalSecret = process.env.INTERNAL_CALL_SECRET;
  // If no secret configured, allow calls (backwards-compatible)
  if (!internalSecret) return true;

  const header = req.headers.get('x-internal-secret') ?? '';
  if (!header) return false;

  const expected = Buffer.from(internalSecret, 'utf8');
  const actual = Buffer.from(header, 'utf8');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

export async function POST(req: NextRequest) {
  // Rate limit: max 20 view pings per minute per IP to prevent view inflation abuse
  const limited = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  // If INTERNAL_CALL_SECRET is set, require it (prevents direct external calls)
  if (!verifyInternalSecret(req)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let body: { object_id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const { object_id } = body;
  if (!object_id || typeof object_id !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // On Vercel, x-forwarded-for first value is the real client IP injected by the platform
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
