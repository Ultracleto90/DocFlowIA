import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  mongoObjectIdParamSchema,
  reviewPlanRequestSchema,
} from '@/core/schemas';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/jwt';
import { reviewPlanRequestByAdmin } from '@/services/server/adminApprovalService';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const rawParams = await params;
    const { id } = mongoObjectIdParamSchema.parse(rawParams);

    const body: unknown = await request.json();
    const parsed = reviewPlanRequestSchema.parse(body);

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const adminUser = await requireAuthenticatedUser(token);

    const result = await reviewPlanRequestByAdmin({
      adminUser,
      requestId: id,
      input: parsed,
      clientIp: extractClientIp(request),
    });

    const response = NextResponse.json(
      { request: result.request, message: result.message },
      { status: 200 },
    );

    if (result.refreshedAdminToken) {
      response.cookies.set(
        AUTH_COOKIE_NAME,
        result.refreshedAdminToken,
        getAuthCookieOptions(),
      );
    }

    return response;
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
