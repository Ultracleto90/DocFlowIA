import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  mongoObjectIdParamSchema,
  updateDemoStatusSchema,
} from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { updateDemoAppointmentByAdmin } from '@/services/server/adminApprovalService';
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
    const parsed = updateDemoStatusSchema.parse(body);

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const adminUser = await requireAuthenticatedUser(token);

    const result = await updateDemoAppointmentByAdmin({
      adminUser,
      demoId: id,
      input: parsed,
      clientIp: extractClientIp(request),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
