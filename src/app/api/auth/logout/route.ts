import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/jwt';
import { logoutUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const clientIp = extractClientIp(request);

    await logoutUser(token, clientIp);

    const response = NextResponse.json(
      { message: 'Sesión cerrada correctamente.' },
      { status: 200 },
    );
    response.cookies.set(AUTH_COOKIE_NAME, '', getAuthCookieOptions(0));
    return response;
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
