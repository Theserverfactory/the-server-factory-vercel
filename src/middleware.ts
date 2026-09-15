import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { isAllowedWhileComingSoon, isComingSoon } from '@/lib/coming-soon';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // ─── Pre-launch gate ─────────────────────
  // 307, not 301: a permanent redirect would have Google de-index the real
  // URLs and consolidate them into "/", which is painful to reverse at launch.
  if (isComingSoon() && !isAllowedWhileComingSoon(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url, 307);
  }

  // ─── Auth ────────────────────────────────
  const isAdminRoute = pathname.startsWith('/admin');
  const isAccountRoute = pathname.startsWith('/account') || pathname.startsWith('/checkout');

  if (!isAdminRoute && !isAccountRoute) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && req.auth.user?.role !== 'ADMIN') {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Broad enough for the gate to cover every page, minus Next internals and
  // anything with a file extension. /robots.txt and /sitemap.xml are allow-listed
  // in code rather than here, so the gate can never hide them from crawlers.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
