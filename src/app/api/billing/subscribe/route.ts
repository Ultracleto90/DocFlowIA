import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { subscribePlanSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { subscribeUserToPlan } from '@/services/server/billingService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = subscribePlanSchema.parse(body);

    const result = await subscribeUserToPlan({
      user,
      plan: parsed.plan,
      clientIp: extractClientIp(request),
    });

    const response = NextResponse.json(
      { user: result.user, message: result.message },
      { status: 200 },
    );
    response.cookies.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    return response;
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
