import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { bundleQuerySchema, projectCodeParamSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { exportProjectBundleOrArtifact } from '@/services/server/projectArtifactsService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ codigo: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const rawParams = await params;
    const { codigo } = projectCodeParamSchema.parse(rawParams);

    const { searchParams } = new URL(request.url);
    const { artifact } = bundleQuerySchema.parse({
      artifact: searchParams.get('artifact') ?? undefined,
    });

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const exported = await exportProjectBundleOrArtifact({
      user,
      codigoProyecto: codigo,
      artifact,
      clientIp: extractClientIp(request),
    });

    return new NextResponse(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        'Content-Type': exported.contentType,
        'Content-Disposition': `attachment; filename="${exported.filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
