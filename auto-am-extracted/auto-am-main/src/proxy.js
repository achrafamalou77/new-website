import { NextResponse } from 'next/server';

const locales = ['fr', 'ar'];
const defaultLocale = 'fr';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // Redirect if there is no locale
  // e.g. incoming request is /contact
  // The new URL is now /fr/contact
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, `/admin/`, `/images/`, `/videos/`, and static files
  matcher: ['/((?!api|_next/static|_next/image|images|videos|admin|favicon.ico|robots.txt|sitemap.xml).*)']
};
