import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { requireAuthenticatedUser } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';
import { unlinkGoogleForUser } from '@/services/server/googleAuthService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await requireAuthenticatedUser(token);
    const clientIp = extractClientIp(request);

    const updatedProfile = await unlinkGoogleForUser(user, clientIp);

    return NextResponse.json(
      {
        user: updatedProfile,
        message: 'Cuenta de Google desvinculada correctamente.',
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
