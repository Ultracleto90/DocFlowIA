import { NextResponse } from 'next/server';
import { handleRouteError } from '@/services/server/errors';
import {
  buildGoogleAuthorizationRequest,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthCookieOptions,
} from '@/services/server/googleAuthService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nextParam = searchParams.get('next');
    const { url, cookiePayload } = buildGoogleAuthorizationRequest(nextParam);

    const response = NextResponse.redirect(url, { status: 302 });
    response.cookies.set(
      GOOGLE_OAUTH_STATE_COOKIE,
      cookiePayload,
      getGoogleOAuthCookieOptions(),
    );
    return response;
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}
