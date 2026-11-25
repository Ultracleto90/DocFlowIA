import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { projectCodeParamSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { getProjectTopologyForUser } from '@/services/server/projectArtifactsService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ codigo: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const rawParams = await params;
    const { codigo } = projectCodeParamSchema.parse(rawParams);

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const result = await getProjectTopologyForUser(
      user,
      codigo,
      extractClientIp(request),
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
