import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', search ? `${pathname}${search}` : pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname.startsWith('/admin') &&
    session.rol !== 'Administrador' &&
    session.plan !== 'Enterprise'
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/files/:path*',
    '/projects/:path*',
    '/billing/:path*',
    '/admin/:path*',
  ],
};
