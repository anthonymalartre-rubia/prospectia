import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rateLimit';
import { cleanEnv } from './lib/envClean';

// Auth-related paths that should be rate-limited on POST
const RATE_LIMITED_PATHS = ['/login', '/signup', '/forgot-password'];
const RATE_LIMITED_API_PREFIX = '/api/auth/';

// Rate limit config: 5 attempts per 15 minutes
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Extract client IP from request headers with fallbacks.
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; take the first (client IP)
    return forwarded.split(',')[0].trim();
  }
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1'
  );
}

/**
 * Check whether a request should be rate-limited.
 * Only POST requests to auth-related routes are limited.
 */
function shouldRateLimit(request) {
  if (request.method !== 'POST') return false;

  const pathname = request.nextUrl.pathname;

  // Check auth page paths
  for (const path of RATE_LIMITED_PATHS) {
    if (pathname.startsWith(path)) return true;
  }

  // Check /api/auth/* routes
  if (pathname.startsWith(RATE_LIMITED_API_PREFIX)) return true;

  return false;
}

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // --- Rate limiting for auth-related POST requests ---
  if (shouldRateLimit(request)) {
    const ip = getClientIp(request);
    const key = `${ip}:${pathname}`;
    const result = checkRateLimit(key, MAX_ATTEMPTS, WINDOW_MS);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives. Veuillez r\u00e9essayer dans quelques minutes.',
          retryAfter: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (result.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
          },
        }
      );
    }

    // Attach rate limit headers to the response for successful requests
    const response = NextResponse.next({ request });
    response.headers.set(
      'X-RateLimit-Remaining',
      result.remaining.toString()
    );
    response.headers.set(
      'X-RateLimit-Reset',
      result.resetAt.toISOString()
    );
    return response;
  }

  // --- Existing auth/redirect logic (unchanged) ---

  // Skip auth check entirely for public routes (saves ~100ms per request)
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/llms.txt' ||
    pathname === '/llms-full.txt' ||
    pathname === '/favicon.ico' ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/cgu') ||
    pathname.startsWith('/confidentialite') ||
    pathname.startsWith('/rgpd') ||
    pathname.startsWith('/opt-out') ||
    pathname.startsWith('/prospection') ||  // FR (matche aussi /prospection-be et /prospection-ch grâce au startsWith)
    pathname.startsWith('/pour') ||           // Pages personas
    pathname.startsWith('/parrainage') ||     // Programme parrainage (a son propre auth check côté client)
    pathname.startsWith('/newsletter') ||     // Page landing newsletter + désabonnement
    pathname.startsWith('/changelog') ||      // Changelog public
    pathname.startsWith('/status') ||         // Status page publique
    pathname.startsWith('/vs') ||
    pathname.startsWith('/alternative') ||
    pathname.startsWith('/comparatif') ||         // pages /comparatif/[slug] + /comparatif-outils-prospection-b2b-france
    pathname.startsWith('/produits') ||           // pages produits /produits/{prospection,campagnes,crm}
    pathname.startsWith('/pricing') ||            // page tarifs standalone
    pathname.startsWith('/etude') ||
    pathname.startsWith('/ressources') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/glossaire') ||
    pathname.startsWith('/outils') ||
    pathname.startsWith('/guide') ||
    pathname.startsWith('/manifest') ||       // manifest.webmanifest généré par Next
    pathname.startsWith('/apple-icon') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth');

  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  // Only create Supabase client for protected routes
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL),
    cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth pages, redirect to dashboard
  if (
    user &&
    (pathname.startsWith('/login') || pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt|json|ico)$).*)',
  ],
};
