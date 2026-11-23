import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { enterpriseConfigSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { updateEnterpriseSettings } from '@/services/server/billingService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = enterpriseConfigSchema.parse(body);

    const result = await updateEnterpriseSettings({
      user,
      input: parsed,
      clientIp: extractClientIp(request),
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
