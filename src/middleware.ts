import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const THREE_DAYS_SECONDS = 3 * 24 * 60 * 60; // 259200

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: THREE_DAYS_SECONDS,
            })
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;
  let hasSession = false;

  // For protected routes — full server-side verification
  if (pathname.startsWith('/profile') || pathname.startsWith('/admin')) {
    const { data: { user } } = await supabase.auth.getUser();
    hasSession = !!user;

    if (pathname.startsWith('/profile') && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/auth/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profile || !['admin', 'moderator'].includes(profile.role as string)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  } else {
    // For public routes — local JWT validation only (no network round-trip)
    const { data: { session } } = await supabase.auth.getSession();
    hasSession = !!session;
  }

  // Rolling session: on every authenticated request extend auth cookie maxAge to 3 days from now
  if (hasSession) {
    for (const { name, value } of request.cookies.getAll()) {
      if (/^sb-.+-auth-token(\.\d+)?$/.test(name)) {
        supabaseResponse.cookies.set(name, value, {
          maxAge: THREE_DAYS_SECONDS,
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }
    }
  }

  // Fire-and-forget view counter for /objects/[slug]
  // Note: ObjectViewTracker client component also handles this on mount.
  // Middleware path covers SSG/ISR cached page loads where client component may not fire.
  const match = pathname.match(/^\/objects\/([^/]+)$/);
  if (match) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const encoded = new TextEncoder().encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);

    // Re-fetch the object_id by slug via the objects API — not inline here,
    // so we skip the middleware view ping (ObjectViewTracker handles it client-side).
    // The middleware only pings if INTERNAL_CALL_SECRET is set (secure mode).
    const internalSecret = process.env.INTERNAL_CALL_SECRET;
    if (internalSecret) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
      fetch(`${siteUrl}/api/track-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': internalSecret,
        },
        body: JSON.stringify({ object_id: match[1], ip_hash: ipHash }),
      }).catch(() => {});
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
