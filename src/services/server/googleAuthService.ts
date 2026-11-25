import crypto from 'node:crypto';
import { toEmbeddedPlan } from '@/core/constants/plans';
import type { AuthUserProfile, UserRecord } from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { userRepository } from '@/infrastructure/repositories/userRepository';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { buildUserProfile } from './authService';
import { ServiceError } from './errors';

const DB_ROLE_WRITE = 'worker_ia_service';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT =
  'https://openidconnect.googleapis.com/v1/userinfo';

export const GOOGLE_OAUTH_STATE_COOKIE = 'docuflow_oauth_state';

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfoResponse {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

export interface StoredOAuthState {
  state: string;
  next: string;
}

export function getAppBaseUrl(): string {
  return (process.env.APP_URL || 'http://localhost').replace(/\/+$/, '');
}

export function getGoogleOAuthCookieOptions(maxAgeSeconds: number = 600) {
  const isHttps = getAppBaseUrl().startsWith('https://');
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isHttps,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function sanitizeNextPath(
  next?: string | null,
  fallback: string = '/dashboard',
): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  return next;
}

function getGoogleConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? '';
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim() ?? '';

  if (!clientId || !clientSecret || !redirectUri) {
    throw new ServiceError(
      503,
      'Google OAuth 2.0 no está configurado en el servidor.',
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthorizationRequest(nextPath?: string | null): {
  url: string;
  cookiePayload: string;
} {
  const { clientId, redirectUri } = getGoogleConfig();
  const state = crypto.randomBytes(24).toString('hex');
  const safeNext = sanitizeNextPath(nextPath, '/dashboard');

  const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  return {
    url: authUrl.toString(),
    cookiePayload: JSON.stringify({ state, next: safeNext }),
  };
}

export function parseOAuthStateCookie(
  rawCookie?: string,
): StoredOAuthState | null {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(rawCookie) as Partial<StoredOAuthState>;
    if (typeof parsed.state !== 'string' || parsed.state.length < 16) {
      return null;
    }
    return {
      state: parsed.state,
      next: sanitizeNextPath(parsed.next, '/dashboard'),
    };
  } catch {
    return null;
  }
}

async function exchangeCodeForProfile(code: string): Promise<{
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
    cache: 'no-store',
  });

  const tokenData = (await tokenResponse.json()) as GoogleTokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new ServiceError(
      401,
      tokenData.error_description ||
        'No se pudo validar el código de autorización con Google.',
    );
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    cache: 'no-store',
  });

  const userInfo = (await userInfoResponse.json()) as GoogleUserInfoResponse;
  if (
    !userInfoResponse.ok ||
    !userInfo.sub ||
    !userInfo.email ||
    userInfo.email_verified === false
  ) {
    throw new ServiceError(
      401,
      'No se pudo obtener un correo verificado desde Google.',
    );
  }

  return {
    googleId: userInfo.sub,
    email: userInfo.email.toLowerCase().trim(),
    name: userInfo.name?.trim() || userInfo.email.split('@')[0],
    picture: userInfo.picture?.trim() || undefined,
  };
}

export async function handleGoogleOAuthCallback(input: {
  code: string;
  clientIp: string;
  currentSessionToken?: string;
}): Promise<{ user: AuthUserProfile; token: string }> {
  const profile = await exchangeCodeForProfile(input.code);

  let currentUser: UserRecord | null = null;
  if (input.currentSessionToken) {
    const session = await verifySessionToken(input.currentSessionToken);
    if (session) {
      const candidate = await userRepository.findById(session.sub);
      if (candidate && candidate.is_active) {
        currentUser = candidate;
      }
    }
  }

  let resolvedUser: UserRecord | null = null;

  if (currentUser) {
    const ownerOfGoogleId = await userRepository.findByGoogleId(profile.googleId);
    if (ownerOfGoogleId && ownerOfGoogleId.id !== currentUser.id) {
      await auditLogRepository.create({
        usuario: currentUser.correo,
        rol_bd: DB_ROLE_WRITE,
        accion: 'VINCULAR_GOOGLE_DUPLICADO',
        entidad_afectada: 'usuarios',
        direccion_ip: input.clientIp,
        resultado: 'BLOQUEADO_UNAUTHORIZED',
      });
      throw new ServiceError(
        409,
        'Esta cuenta de Google ya está vinculada a otro usuario.',
      );
    }

    resolvedUser = await userRepository.linkGoogleAccount(currentUser.id, {
      google_id: profile.googleId,
      avatar_url: profile.picture,
      auth_provider: currentUser.has_local_password ? 'hybrid' : 'google',
    });

    await auditLogRepository.create({
      usuario: currentUser.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'VINCULAR_GOOGLE',
      entidad_afectada: 'usuarios',
      direccion_ip: input.clientIp,
      resultado: 'EXITOSO',
    });
  } else {
    const byGoogleId = await userRepository.findByGoogleId(profile.googleId);
    const existing = byGoogleId ?? (await userRepository.findByEmail(profile.email));

    if (existing) {
      if (!existing.is_active) {
        await auditLogRepository.create({
          usuario: existing.correo,
          rol_bd: DB_ROLE_WRITE,
          accion: 'LOGIN_GOOGLE_INACTIVO',
          entidad_afectada: 'usuarios',
          direccion_ip: input.clientIp,
          resultado: 'BLOQUEADO_UNAUTHORIZED',
        });
        throw new ServiceError(401, 'Tu cuenta se encuentra inactiva.');
      }

      resolvedUser = await userRepository.linkGoogleAccount(existing.id, {
        google_id: profile.googleId,
        avatar_url: profile.picture ?? existing.avatar_url,
        auth_provider: existing.has_local_password ? 'hybrid' : 'google',
      });
    } else {
      resolvedUser = await userRepository.createGoogleUser({
        nombre: profile.name,
        correo: profile.email,
        google_id: profile.googleId,
        avatar_url: profile.picture,
        rol: 'Desarrollador',
        plan: toEmbeddedPlan('Freemium'),
      });
    }

    if (resolvedUser) {
      await auditLogRepository.create({
        usuario: resolvedUser.correo,
        rol_bd: DB_ROLE_WRITE,
        accion: 'LOGIN_GOOGLE',
        entidad_afectada: 'usuarios',
        direccion_ip: input.clientIp,
        resultado: 'EXITOSO',
      });
    }
  }

  if (!resolvedUser) {
    throw new ServiceError(
      500,
      'No se pudo completar la sesión con Google.',
    );
  }

  const token = await signSessionToken({
    sub: resolvedUser.id,
    correo: resolvedUser.correo,
    nombre: resolvedUser.nombre,
    rol: resolvedUser.rol,
    plan: resolvedUser.plan.nombre,
  });

  const fullProfile = await buildUserProfile(resolvedUser);
  return { user: fullProfile, token };
}

export async function unlinkGoogleForUser(
  user: UserRecord,
  clientIp: string,
): Promise<AuthUserProfile> {
  if (!user.google_id) {
    throw new ServiceError(400, 'No tienes una cuenta de Google vinculada.');
  }

  if (!user.has_local_password) {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'DESVINCULAR_GOOGLE',
      entidad_afectada: 'usuarios',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      400,
      'No puedes desvincular Google porque tu cuenta no tiene una contraseña local configurada.',
    );
  }

  const updated = await userRepository.unlinkGoogleAccount(user.id);
  if (!updated) {
    throw new ServiceError(404, 'Usuario no encontrado.');
  }

  await auditLogRepository.create({
    usuario: user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'DESVINCULAR_GOOGLE',
    entidad_afectada: 'usuarios',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return buildUserProfile(updated);
}
