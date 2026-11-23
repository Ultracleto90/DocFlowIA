import crypto from 'node:crypto';
import {
  PLANS_LIST,
  toEmbeddedPlan,
  type PlanName,
  type UserRole,
} from '@/core/constants/plans';
import type {
  AuthUserProfile,
  EnterpriseConfigRequestDTO,
  PlansCatalogResponseDTO,
  TeamMember,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { userRepository } from '@/infrastructure/repositories/userRepository';
import { signSessionToken } from '@/lib/auth/jwt';
import { buildUserProfile } from './authService';
import { ServiceError } from './errors';

const DB_ROLE_WRITE = 'worker_ia_service';

export function getPlansCatalog(): PlansCatalogResponseDTO {
  return { plans: PLANS_LIST };
}

export async function subscribeUserToPlan(params: {
  user: UserRecord;
  plan: PlanName;
  clientIp: string;
}): Promise<{ user: AuthUserProfile; token: string; message: string }> {
  const embeddedPlan = toEmbeddedPlan(params.plan);
  const updated = await userRepository.updatePlan(
    params.user.correo,
    embeddedPlan,
  );

  if (!updated) {
    throw new ServiceError(404, 'Usuario no encontrado.');
  }

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'CAMBIO_PLAN',
    entidad_afectada: `usuarios (${params.user.plan.nombre} -> ${params.plan})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  const token = await signSessionToken({
    sub: updated.id,
    correo: updated.correo,
    nombre: updated.nombre,
    rol: updated.rol,
    plan: updated.plan.nombre,
  });

  const profile = await buildUserProfile(updated);
  return {
    user: profile,
    token,
    message: `Plan actualizado a ${params.plan} correctamente.`,
  };
}

export async function updateEnterpriseSettings(params: {
  user: UserRecord;
  input: EnterpriseConfigRequestDTO;
  clientIp: string;
}): Promise<{ user: AuthUserProfile; generated_api_key?: string }> {
  if (params.user.plan.nombre !== 'Enterprise') {
    await auditLogRepository.create({
      usuario: params.user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'INTENTO_CONFIG_ENTERPRISE',
      entidad_afectada: 'usuarios (white_label/api_key)',
      direccion_ip: params.clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'White-Label y API Key REST están disponibles exclusivamente en el plan Enterprise.',
    );
  }

  let generatedApiKey: string | undefined;
  if (params.input.rotate_api_key) {
    generatedApiKey = `df_live_${crypto.randomBytes(24).toString('hex')}`;
  }

  const updated = await userRepository.updateEnterpriseConfig(
    params.user.correo,
    {
      white_label: params.input.white_label,
      api_key: generatedApiKey,
    },
  );

  if (!updated) {
    throw new ServiceError(404, 'Usuario no encontrado.');
  }

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'CONFIGURACION_ENTERPRISE',
    entidad_afectada: 'usuarios (white_label/api_key)',
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  const profile = await buildUserProfile(updated);
  return {
    user: profile,
    ...(generatedApiKey ? { generated_api_key: generatedApiKey } : {}),
  };
}

function getMaxInvitedMembers(plan: PlanName): number | null {
  switch (plan) {
    case 'Freemium':
      return 0;
    case 'Pro':
      return 1;
    case 'Team IA':
      return 5;
    case 'Enterprise':
      return null;
  }
}

export async function inviteTeamMember(params: {
  user: UserRecord;
  correo: string;
  rol: UserRole;
  clientIp: string;
}): Promise<{ user: AuthUserProfile; team_members: TeamMember[] }> {
  const targetEmail = params.correo.toLowerCase().trim();
  if (targetEmail === params.user.correo.toLowerCase()) {
    throw new ServiceError(
      400,
      'No puedes invitarte a ti mismo como miembro del equipo.',
    );
  }

  const maxInvited = getMaxInvitedMembers(params.user.plan.nombre);
  if (maxInvited === 0) {
    throw new ServiceError(
      403,
      'El plan Freemium es individual (1 usuario). Actualiza a Pro, Team IA o Enterprise para invitar miembros.',
    );
  }

  if (params.user.plan.nombre === 'Pro' && params.rol !== 'Revisor QA') {
    throw new ServiceError(
      403,
      'El plan Pro permite 1 invitado únicamente con rol de solo lectura (Revisor QA).',
    );
  }

  const currentMembers = params.user.team_members ?? [];
  const existsIndex = currentMembers.findIndex(
    (m) => m.correo.toLowerCase() === targetEmail,
  );

  if (
    existsIndex === -1 &&
    maxInvited !== null &&
    currentMembers.length >= maxInvited
  ) {
    throw new ServiceError(
      403,
      `Has alcanzado el límite de ${maxInvited} miembro(s) invitado(s) para tu plan ${params.user.plan.nombre}.`,
    );
  }

  const nextMembers = currentMembers.map((m) => ({
    correo: m.correo,
    rol: m.rol,
    invited_at: new Date(m.invited_at),
  }));

  if (existsIndex >= 0) {
    nextMembers[existsIndex] = {
      correo: targetEmail,
      rol: params.rol,
      invited_at: new Date(),
    };
  } else {
    nextMembers.push({
      correo: targetEmail,
      rol: params.rol,
      invited_at: new Date(),
    });
  }

  const updated = await userRepository.updateTeamMembers(
    params.user.correo,
    nextMembers,
  );
  if (!updated) {
    throw new ServiceError(404, 'Usuario no encontrado.');
  }

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'GESTION_EQUIPO_INVITE',
    entidad_afectada: `usuarios (${targetEmail} · ${params.rol})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  const profile = await buildUserProfile(updated);
  return {
    user: profile,
    team_members: profile.team_members ?? [],
  };
}

export async function removeTeamMember(params: {
  user: UserRecord;
  correo: string;
  clientIp: string;
}): Promise<{ user: AuthUserProfile; team_members: TeamMember[] }> {
  const targetEmail = params.correo.toLowerCase().trim();
  const currentMembers = params.user.team_members ?? [];
  const filtered = currentMembers
    .filter((m) => m.correo.toLowerCase() !== targetEmail)
    .map((m) => ({
      correo: m.correo,
      rol: m.rol,
      invited_at: new Date(m.invited_at),
    }));

  if (filtered.length === currentMembers.length) {
    throw new ServiceError(
      404,
      `El miembro ${targetEmail} no pertenece a tu equipo.`,
    );
  }

  const updated = await userRepository.updateTeamMembers(
    params.user.correo,
    filtered,
  );
  if (!updated) {
    throw new ServiceError(404, 'Usuario no encontrado.');
  }

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'GESTION_EQUIPO_REMOVE',
    entidad_afectada: `usuarios (${targetEmail})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  const profile = await buildUserProfile(updated);
  return {
    user: profile,
    team_members: profile.team_members ?? [],
  };
}
