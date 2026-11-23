import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth/jwt';
import { getCurrentUserProfile } from '@/services/server/authService';
import { handleRouteError } from '@/services/server/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    const user = await getCurrentUserProfile(token);

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
