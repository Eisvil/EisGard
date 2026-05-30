import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

// In-memory store — per serverless instance.
// On Vercel each cold start gets a fresh store, which is acceptable:
// this prevents per-instance abuse rather than guaranteeing global limits.
// For strict global limits, swap this map for Upstash Redis / Vercel KV.
const store = new Map<string, WindowEntry>();

// Clean up expired entries periodically to prevent memory growth
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function getClientIp(request: NextRequest): string {
  // On Vercel, x-forwarded-for is injected by the platform with the real client IP first.
  const xff = request.headers.get('x-forwarded-for');
  const ip = xff ? xff.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Returns a 429 NextResponse if the request exceeds the rate limit, or null if allowed.
 * Call at the top of route handlers before any business logic.
 */
export function rateLimit(
  request: NextRequest,
  options: RateLimitOptions,
): NextResponse | null {
  maybeCleanup();

  const ip = getClientIp(request);
  const key = `${request.nextUrl.pathname}::${ip}`;
  const now = Date.now();

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count > options.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Слишком много запросов. Попробуйте позже.' } },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
        },
      },
    );
  }

  return null;
}
