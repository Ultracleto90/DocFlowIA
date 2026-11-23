import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { updateDocumentSchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { updateDocumentForUser } from '@/services/server/documentService';
import { handleRouteError } from '@/services/server/errors';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);

    const body: unknown = await request.json();
    const parsed = updateDocumentSchema.parse(body);

    const document = await updateDocumentForUser({
      user,
      documentId: id,
      patch: parsed,
      clientIp: extractClientIp(request),
    });

    return NextResponse.json({ document }, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
