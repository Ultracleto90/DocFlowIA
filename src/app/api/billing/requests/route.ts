import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createPlanRequestSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { createPlanRequest } from '@/services/server/planRequestService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = createPlanRequestSchema.parse(body);
    const clientIp = extractClientIp(request);

    const result = await createPlanRequest(user, parsed, clientIp);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
