import { SignJWT, jwtVerify } from 'jose';
import {
  PLAN_NAMES,
  USER_ROLES,
  type PlanName,
  type UserRole,
} from '@/core/constants/plans';
import type { AuthSessionPayload } from '@/core/types';

export const AUTH_COOKIE_NAME = 'docuflow_session';

const DEFAULT_EXPIRES_IN = '7d';
export const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecretBytes(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export function getAuthCookieOptions(maxAgeSeconds: number = SEVEN_DAYS_SECONDS) {
  const appUrl = process.env.APP_URL?.trim() ?? '';
  const isHttps = appUrl.startsWith('https://');
  const expires =
    maxAgeSeconds > 0
      ? new Date(Date.now() + maxAgeSeconds * 1000)
      : new Date(0);

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isHttps,
    path: '/',
    maxAge: maxAgeSeconds,
    expires,
  };
}

export async function signSessionToken(
  payload: AuthSessionPayload,
): Promise<string> {
  const secret = getJwtSecretBytes();
  const expiresIn = process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN;

  return new SignJWT({
    correo: payload.correo,
    nombre: payload.nombre,
    rol: payload.rol,
    plan: payload.plan,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<AuthSessionPayload | null> {
  try {
    const secret = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    const correo = typeof payload.correo === 'string' ? payload.correo : '';
    const nombre = typeof payload.nombre === 'string' ? payload.nombre : '';
    const rol = payload.rol as UserRole;
    const plan = payload.plan as PlanName;

    if (
      !sub ||
      !correo ||
      !nombre ||
      !USER_ROLES.includes(rol) ||
      !PLAN_NAMES.includes(plan)
    ) {
      return null;
    }

    return { sub, correo, nombre, rol, plan };
  } catch {
    return null;
  }
}
