import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { googleCallbackQuerySchema } from '@/core/schemas';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '@/lib/auth/jwt';
import { ServiceError } from '@/services/server/errors';
import {
  getAppBaseUrl,
  GOOGLE_OAUTH_STATE_COOKIE,
  getGoogleOAuthCookieOptions,
  handleGoogleOAuthCallback,
  parseOAuthStateCookie,
} from '@/services/server/googleAuthService';
import { extractClientIp } from '@/services/server/requestContext';

export const dynamic = 'force-dynamic';

function buildFailureRedirect(
  baseUrl: string,
  nextPath: string | undefined,
  errorCode: string,
): NextResponse {
  const isBillingFlow = nextPath?.startsWith('/billing');
  const destination = isBillingFlow
    ? `${baseUrl}/billing?google_error=${encodeURIComponent(errorCode)}`
    : `${baseUrl}/login?error=${encodeURIComponent(errorCode)}`;

  const response = NextResponse.redirect(destination, { status: 302 });
  response.cookies.set(
    GOOGLE_OAUTH_STATE_COOKIE,
    '',
    getGoogleOAuthCookieOptions(0),
  );
  return response;
}

export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl();
  const cookieStore = await cookies();
  const rawStateCookie = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const storedState = parseOAuthStateCookie(rawStateCookie);

  try {
    const { searchParams } = new URL(request.url);
    const parsedQuery = googleCallbackQuerySchema.safeParse({
      code: searchParams.get('code') ?? undefined,
      state: searchParams.get('state') ?? undefined,
      error: searchParams.get('error') ?? undefined,
    });

    if (!parsedQuery.success) {
      return buildFailureRedirect(
        baseUrl,
        storedState?.next,
        'google_auth_failed',
      );
    }

    if (parsedQuery.data.error) {
      return buildFailureRedirect(
        baseUrl,
        storedState?.next,
        'google_cancelled',
      );
    }

    const { code, state } = parsedQuery.data;
    if (!code || !state || !storedState || storedState.state !== state) {
      return buildFailureRedirect(
        baseUrl,
        storedState?.next,
        'google_state_invalid',
      );
    }

    const clientIp = extractClientIp(request);
    const currentSessionToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    const { token } = await handleGoogleOAuthCallback({
      code,
      clientIp,
      currentSessionToken,
    });

    let targetPath = storedState.next || '/dashboard';
    if (targetPath === '/billing') {
      targetPath = '/billing?google=linked';
    } else if (targetPath.startsWith('/billing?')) {
      targetPath = `${targetPath}&google=linked`;
    }

    const response = NextResponse.redirect(`${baseUrl}${targetPath}`, {
      status: 302,
    });
    response.cookies.set(
      GOOGLE_OAUTH_STATE_COOKIE,
      '',
      getGoogleOAuthCookieOptions(0),
    );
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error: unknown) {
    if (error instanceof ServiceError && error.status === 409) {
      return buildFailureRedirect(
        baseUrl,
        storedState?.next,
        'google_already_linked',
      );
    }
    return buildFailureRedirect(
      baseUrl,
      storedState?.next,
      'google_auth_failed',
    );
  }
}
