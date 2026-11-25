import type {
  CreatePlanRequestDTO,
  CreatePlanRequestResponseDTO,
  MyPlanRequestsResponseDTO,
  PlanRequestInitialMember,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { planRequestRepository } from '@/infrastructure/repositories/planRequestRepository';
import { ServiceError } from './errors';

const DB_ROLE_WRITE = 'worker_ia_service';

function normalizeInitialMembers(
  members?: PlanRequestInitialMember[],
): PlanRequestInitialMember[] | undefined {
  if (!members || members.length === 0) {
    return undefined;
  }

  const seen = new Set<string>();
  const unique: PlanRequestInitialMember[] = [];
  for (const item of members) {
    const correo = item.correo.toLowerCase().trim();
    if (!seen.has(correo)) {
      seen.add(correo);
      unique.push({ correo, rol: item.rol });
    }
  }

  if (unique.length > 5) {
    throw new ServiceError(
      400,
      'El onboarding inicial de Team IA admite hasta 5 invitados.',
    );
  }

  return unique;
}

export async function createPlanRequest(
  user: UserRecord,
  input: CreatePlanRequestDTO,
  clientIp: string,
): Promise<CreatePlanRequestResponseDTO> {
  const normalizedMembers = normalizeInitialMembers(input.miembros_iniciales);

  const request = await planRequestRepository.create({
    usuario_id: user.id,
    plan_solicitado: input.plan_solicitado,
    organizacion: input.organizacion,
    industria: input.industria,
    correo_corporativo: input.correo_corporativo,
    num_usuarios: input.num_usuarios,
    personalizaciones: input.personalizaciones,
    integracion_git: input.integracion_git,
    miembros_iniciales: normalizedMembers,
  });

  await auditLogRepository.create({
    usuario: user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: `SOLICITUD_PLAN:${request.plan_solicitado}`,
    entidad_afectada: 'solicitudes_planes',
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return {
    request,
    message:
      request.plan_solicitado === 'Enterprise'
        ? 'Solicitud Enterprise registrada. Un arquitecto de soluciones revisará tu configuración.'
        : 'Solicitud de onboarding Team IA registrada correctamente.',
  };
}

export async function listMyPlanRequests(
  userId: string,
): Promise<MyPlanRequestsResponseDTO> {
  const requests = await planRequestRepository.findByUserId(userId);
  return { requests };
}
