import bcrypt from 'bcryptjs';
import { getPlanDefinition, toEmbeddedPlan } from '@/core/constants/plans';
import type {
  AuthUserProfile,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { userRepository } from '@/infrastructure/repositories/userRepository';
import { signSessionToken, verifySessionToken } from '@/lib/auth/jwt';
import { ServiceError } from './errors';

const DB_ROLE_WRITE = 'worker_ia_service';

export async function buildUserProfile(
  user: UserRecord,
): Promise<AuthUserProfile> {
  const planDetails = getPlanDefinition(user.plan.nombre);
  const usedThisMonth = await projectRepository.countMonthlyByUser(user.correo);
  const maxProjects = user.plan.max_proyectos_mes;

  return {
    ...user,
    plan_details: planDetails,
    usage: {
      proyectos_mes_actual: usedThisMonth,
      max_proyectos_mes: maxProjects,
      restantes_mes: Math.max(0, maxProjects - usedThisMonth),
    },
  };
}

export async function registerUser(
  input: RegisterRequestDTO,
  clientIp: string,
): Promise<{ user: AuthUserProfile; token: string }> {
  const normalizedEmail = input.correo.toLowerCase().trim();
  const existing = await userRepository.findByEmail(normalizedEmail);

  if (existing) {
    await auditLogRepository.create({
      usuario: normalizedEmail,
      rol_bd: DB_ROLE_WRITE,
      accion: 'REGISTRO_DUPLICADO',
      entidad_afectada: 'usuarios',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(409, 'Ya existe una cuenta registrada con ese correo.');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const createdUser = await userRepository.create({
    nombre: input.nombre.trim(),
    correo: normalizedEmail,
    password_hash: passwordHash,
    rol: 'Desarrollador',
    plan: toEmbeddedPlan('Freemium'),
  });

  await auditLogRepository.create({
    usuario: createdUser.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'REGISTRO_USUARIO',
    entidad_afectada: 'usuarios',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  const token = await signSessionToken({
    sub: createdUser.id,
    correo: createdUser.correo,
    nombre: createdUser.nombre,
    rol: createdUser.rol,
    plan: createdUser.plan.nombre,
  });

  const profile = await buildUserProfile(createdUser);
  return { user: profile, token };
}

export async function loginUser(
  input: LoginRequestDTO,
  clientIp: string,
): Promise<{ user: AuthUserProfile; token: string }> {
  const normalizedEmail = input.correo.toLowerCase().trim();
  const userWithPassword =
    await userRepository.findByEmailWithPassword(normalizedEmail);

  if (!userWithPassword || !userWithPassword.is_active) {
    await auditLogRepository.create({
      usuario: normalizedEmail,
      rol_bd: DB_ROLE_WRITE,
      accion: 'LOGIN_FALLIDO',
      entidad_afectada: 'usuarios',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(401, 'Credenciales inválidas o cuenta inactiva.');
  }

  if (!userWithPassword.password_hash) {
    await auditLogRepository.create({
      usuario: normalizedEmail,
      rol_bd: DB_ROLE_WRITE,
      accion: 'LOGIN_FALLIDO',
      entidad_afectada: 'usuarios',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      401,
      'Esta cuenta usa acceso con Google. Selecciona "Continuar con Google".',
    );
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    userWithPassword.password_hash,
  );

  if (!isPasswordValid) {
    await auditLogRepository.create({
      usuario: normalizedEmail,
      rol_bd: DB_ROLE_WRITE,
      accion: 'LOGIN_FALLIDO',
      entidad_afectada: 'usuarios',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(401, 'Credenciales inválidas o cuenta inactiva.');
  }

  await auditLogRepository.create({
    usuario: userWithPassword.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'LOGIN_EXITOSO',
    entidad_afectada: 'usuarios',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  const { password_hash: _ignoredHash, ...safeUser } = userWithPassword;
  void _ignoredHash;

  const token = await signSessionToken({
    sub: safeUser.id,
    correo: safeUser.correo,
    nombre: safeUser.nombre,
    rol: safeUser.rol,
    plan: safeUser.plan.nombre,
  });

  const profile = await buildUserProfile(safeUser);
  return { user: profile, token };
}

export async function requireAuthenticatedUser(
  token: string | undefined,
): Promise<UserRecord> {
  if (!token) {
    throw new ServiceError(401, 'No autenticado. Inicia sesión para continuar.');
  }

  const session = await verifySessionToken(token);
  if (!session) {
    throw new ServiceError(401, 'Sesión inválida o expirada.');
  }

  const user = await userRepository.findById(session.sub);
  if (!user || !user.is_active) {
    throw new ServiceError(401, 'Usuario no encontrado o cuenta desactivada.');
  }

  return user;
}

export async function getCurrentUserProfile(
  token: string | undefined,
): Promise<AuthUserProfile> {
  const user = await requireAuthenticatedUser(token);
  return buildUserProfile(user);
}

export async function logoutUser(
  token: string | undefined,
  clientIp: string,
): Promise<void> {
  if (!token) {
    return;
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return;
  }

  await auditLogRepository.create({
    usuario: session.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'LOGOUT_USUARIO',
    entidad_afectada: 'usuarios',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });
}
