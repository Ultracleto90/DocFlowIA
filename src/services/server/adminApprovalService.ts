import { toEmbeddedPlan } from '@/core/constants/plans';
import type {
  AdminApprovalsResponseDTO,
  PlanRequestRecord,
  ReviewPlanRequestDTO,
  UpdateDemoStatusRequestDTO,
  UpdateDemoStatusResponseDTO,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { demoAppointmentRepository } from '@/infrastructure/repositories/demoAppointmentRepository';
import { planRequestRepository } from '@/infrastructure/repositories/planRequestRepository';
import { userRepository } from '@/infrastructure/repositories/userRepository';
import { signSessionToken } from '@/lib/auth/jwt';
import { ServiceError } from './errors';

const DB_ROLE_WRITE = 'worker_ia_service';

function assertObjectId(id: string): void {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new ServiceError(400, 'El identificador del registro es inválido.');
  }
}

async function assertAdministrator(
  user: UserRecord,
  clientIp: string,
  action: string,
): Promise<void> {
  if (user.rol !== 'Administrador') {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: action,
      entidad_afectada: 'admin_approvals',
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'Acceso restringido exclusivamente a usuarios con rol Administrador.',
    );
  }
}

export async function listAdminApprovals(
  adminUser: UserRecord,
  clientIp: string,
): Promise<AdminApprovalsResponseDTO> {
  await assertAdministrator(
    adminUser,
    clientIp,
    'INTENTO_ACCESO_APROBACIONES',
  );

  const [requests, demos] = await Promise.all([
    planRequestRepository.findAll(100),
    demoAppointmentRepository.findAll(100),
  ]);

  return { requests, demos };
}

export async function reviewPlanRequestByAdmin(params: {
  adminUser: UserRecord;
  requestId: string;
  input: ReviewPlanRequestDTO;
  clientIp: string;
}): Promise<{
  request: PlanRequestRecord;
  message: string;
  refreshedAdminToken?: string;
}> {
  await assertAdministrator(
    params.adminUser,
    params.clientIp,
    'INTENTO_APROBACION_PLAN',
  );
  assertObjectId(params.requestId);

  const existing = await planRequestRepository.findById(params.requestId);
  if (!existing) {
    throw new ServiceError(404, 'Solicitud de plan no encontrada.');
  }

  const updatedRequest = await planRequestRepository.updateDecision(
    params.requestId,
    {
      estado: params.input.estado,
      notas_admin: params.input.notas_admin ?? '',
    },
  );
  if (!updatedRequest) {
    throw new ServiceError(404, 'Solicitud de plan no encontrada.');
  }

  let refreshedAdminToken: string | undefined;

  if (params.input.estado === 'aprobada') {
    const targetUser = await userRepository.findById(existing.usuario_id);
    if (!targetUser) {
      throw new ServiceError(
        404,
        'El usuario solicitante no existe en usuarios.',
      );
    }

    await userRepository.updatePlan(
      targetUser.correo,
      toEmbeddedPlan(existing.plan_solicitado),
    );

    if (existing.plan_solicitado === 'Enterprise') {
      const wantsWhiteLabel =
        Boolean(targetUser.white_label?.enabled) ||
        existing.personalizaciones.some((item) =>
          item.toLowerCase().includes('white-label'),
        );

      if (wantsWhiteLabel) {
        await userRepository.updateEnterpriseConfig(targetUser.correo, {
          white_label: {
            enabled: true,
            brand_name:
              targetUser.white_label?.brand_name?.trim() ||
              existing.organizacion,
            ...(targetUser.white_label?.logo_url
              ? { logo_url: targetUser.white_label.logo_url }
              : {}),
          },
        });
      }
    } else if (
      existing.plan_solicitado === 'Team IA' &&
      existing.miembros_iniciales &&
      existing.miembros_iniciales.length > 0
    ) {
      const merged = new Map<
        string,
        { correo: string; rol: UserRecord['rol']; invited_at: Date }
      >();
      for (const prev of targetUser.team_members ?? []) {
        merged.set(prev.correo.toLowerCase(), {
          correo: prev.correo,
          rol: prev.rol,
          invited_at: new Date(prev.invited_at),
        });
      }
      for (const initMember of existing.miembros_iniciales) {
        const key = initMember.correo.toLowerCase().trim();
        if (key === targetUser.correo.toLowerCase() || merged.size >= 5) {
          continue;
        }
        if (!merged.has(key)) {
          merged.set(key, {
            correo: key,
            rol: initMember.rol,
            invited_at: new Date(),
          });
        }
      }
      await userRepository.updateTeamMembers(
        targetUser.correo,
        Array.from(merged.values()),
      );
    }

    await auditLogRepository.create({
      usuario: params.adminUser.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'APROBACION_PLAN',
      entidad_afectada: `solicitudes_planes (${existing.plan_solicitado} -> ${targetUser.correo})`,
      direccion_ip: params.clientIp,
      resultado: 'EXITOSO',
    });

    if (targetUser.id === params.adminUser.id) {
      refreshedAdminToken = await signSessionToken({
        sub: targetUser.id,
        correo: targetUser.correo,
        nombre: targetUser.nombre,
        rol: targetUser.rol,
        plan: existing.plan_solicitado,
      });
    }

    return {
      request: updatedRequest,
      refreshedAdminToken,
      message: `Solicitud aprobada y plan ${existing.plan_solicitado} activado para ${targetUser.correo}.`,
    };
  }

  await auditLogRepository.create({
    usuario: params.adminUser.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'RECHAZO_PLAN',
    entidad_afectada: `solicitudes_planes (${params.requestId})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return {
    request: updatedRequest,
    message: `Solicitud ${existing.plan_solicitado} marcada como rechazada.`,
  };
}

export async function updateDemoAppointmentByAdmin(params: {
  adminUser: UserRecord;
  demoId: string;
  input: UpdateDemoStatusRequestDTO;
  clientIp: string;
}): Promise<UpdateDemoStatusResponseDTO> {
  await assertAdministrator(
    params.adminUser,
    params.clientIp,
    'INTENTO_ACTUALIZAR_CITA_DEMO',
  );
  assertObjectId(params.demoId);

  const existing = await demoAppointmentRepository.findById(params.demoId);
  if (!existing) {
    throw new ServiceError(404, 'Cita de demo no encontrada.');
  }

  const updated = await demoAppointmentRepository.updateStatus(params.demoId, {
    estado: params.input.estado,
    notas: params.input.notas,
  });
  if (!updated) {
    throw new ServiceError(404, 'Cita de demo no encontrada.');
  }

  await auditLogRepository.create({
    usuario: params.adminUser.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'ACTUALIZAR_CITA_DEMO',
    entidad_afectada: `citas_demo (${params.demoId} -> ${params.input.estado})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return {
    appointment: updated,
    message: `Cita de ${updated.organizacion} actualizada a estado ${updated.estado}.`,
  };
}
