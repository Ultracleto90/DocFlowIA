import { NextResponse } from 'next/server';
import { registerSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/jwt';
import { registerUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = registerSchema.parse(body);
    const clientIp = extractClientIp(request);

    const { user, token } = await registerUser(parsed, clientIp);

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
