import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exportFormatQuerySchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { exportDocumentForUser } from '@/services/server/documentService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const { searchParams } = new URL(request.url);
    const { format } = exportFormatQuerySchema.parse({
      format: searchParams.get('format'),
    });

    const exported = await exportDocumentForUser({
      user,
      documentId: id,
      format,
      clientIp: extractClientIp(request),
    });

    return new NextResponse(new Uint8Array(exported.buffer), {
      status: 200,
      headers: {
        'Content-Type': exported.contentType,
        'Content-Disposition': `attachment; filename="${exported.filename}"`,
        'Content-Length': String(exported.buffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
