import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { auditQuerySchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { getAdminAuditReport } from '@/services/server/auditService';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const { searchParams } = new URL(request.url);
    const parsed = auditQuerySchema.parse({
      resultado: searchParams.get('resultado') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    const report = await getAdminAuditReport({
      user,
      resultado: parsed.resultado,
      limit: parsed.limit,
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
