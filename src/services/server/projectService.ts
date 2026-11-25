import fs from 'node:fs/promises';
import type {
  CreateProjectResponseDTO,
  DeleteProjectResponseDTO,
  FolderAccessRole,
  ProjectDetailResponseDTO,
  ProjectListResponseDTO,
  ProjectRecord,
  UpdateProjectAccessResponseDTO,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { componentRepository } from '@/infrastructure/repositories/componentRepository';
import { documentRepository } from '@/infrastructure/repositories/documentRepository';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { topologyRepository } from '@/infrastructure/repositories/topologyRepository';
import { processProjectZip } from './aiPipelineAdapter';
import { ServiceError } from './errors';
import { planGuardService } from './planGuardService';

const DB_ROLE_WRITE = 'worker_ia_service';

export function getUserProjectPermission(
  user: UserRecord,
  project: ProjectRecord,
): 'owner_or_admin' | FolderAccessRole | null {
  if (
    user.rol === 'Administrador' ||
    project.usuario_correo.toLowerCase() === user.correo.toLowerCase()
  ) {
    return 'owner_or_admin';
  }

  const normalizedEmail = user.correo.toLowerCase().trim();
  const aclEntry = project.permisos_acceso?.find(
    (entry) => entry.email.toLowerCase() === normalizedEmail,
  );
  return aclEntry ? aclEntry.rol_carpeta : null;
}

function assertProjectAccess(user: UserRecord, project: ProjectRecord): boolean {
  return getUserProjectPermission(user, project) !== null;
}

export async function listProjectsForUser(
  user: UserRecord,
): Promise<ProjectListResponseDTO> {
  const projects =
    user.rol === 'Administrador'
      ? await projectRepository.findAll()
      : await projectRepository.findByUserEmail(user.correo);

  const used = await projectRepository.countMonthlyByUser(user.correo);
  const max = user.plan.max_proyectos_mes;

  return {
    projects,
    usage: {
      proyectos_mes_actual: used,
      max_proyectos_mes: max,
      restantes_mes: Math.max(0, max - used),
    },
  };
}

export async function createProjectFromZip(params: {
  user: UserRecord;
  nombre_proyecto: string;
  framework: string;
  file: File;
  clientIp: string;
}): Promise<CreateProjectResponseDTO> {
  await planGuardService.checkMonthlyQuota(params.user);
  planGuardService.checkZipSize(params.user.plan.nombre, params.file.size);

  const codigoProyecto = await projectRepository.getNextProjectCode();
  const arrayBuffer = await params.file.arrayBuffer();
  const zipBuffer = Buffer.from(arrayBuffer);

  const result = await processProjectZip({
    codigo_proyecto: codigoProyecto,
    nombre_proyecto: params.nombre_proyecto,
    framework: params.framework,
    user: params.user,
    fileName: params.file.name,
    zipBuffer,
  });

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'CARGA_PROYECTO_ZIP',
    entidad_afectada: `proyectos (${codigoProyecto})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return result;
}

export async function getProjectDetailForUser(
  user: UserRecord,
  codigoProyecto: string,
  clientIp: string,
): Promise<ProjectDetailResponseDTO> {
  const project = await projectRepository.findByCode(codigoProyecto);
  if (!project) {
    throw new ServiceError(404, `El proyecto ${codigoProyecto} no existe.`);
  }

  if (!assertProjectAccess(user, project)) {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'INTENTO_ACCESO_PROYECTO',
      entidad_afectada: `proyectos (${codigoProyecto})`,
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(403, 'No tienes permisos para acceder a este proyecto.');
  }

  const [components, documents] = await Promise.all([
    componentRepository.findByProjectCode(codigoProyecto),
    documentRepository.findByProjectCode(codigoProyecto),
  ]);

  return { project, components, documents };
}

export async function deleteProjectForUser(
  user: UserRecord,
  codigoProyecto: string,
  clientIp: string,
): Promise<DeleteProjectResponseDTO> {
  const project = await projectRepository.findByCode(codigoProyecto);
  if (!project) {
    throw new ServiceError(404, `El proyecto ${codigoProyecto} no existe.`);
  }

  if (
    user.rol !== 'Administrador' &&
    project.usuario_correo.toLowerCase() !== user.correo.toLowerCase()
  ) {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'INTENTO_ELIMINACION_PROYECTO',
      entidad_afectada: `proyectos (${codigoProyecto})`,
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(403, 'No tienes permisos para eliminar este proyecto.');
  }

  await Promise.all([
    componentRepository.deleteByProjectCode(codigoProyecto),
    documentRepository.deleteByProjectCode(codigoProyecto),
    topologyRepository.deleteByProjectCode(codigoProyecto),
  ]);
  await projectRepository.deleteByCode(codigoProyecto);

  try {
    await fs.unlink(project.archivo_zip);
  } catch {
    // Ignore if file was seed-only or already removed
  }

  await auditLogRepository.create({
    usuario: user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'ELIMINACION_PROYECTO',
    entidad_afectada: `proyectos (${codigoProyecto})`,
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return {
    message: `Proyecto ${codigoProyecto} eliminado correctamente.`,
    codigo_proyecto: codigoProyecto,
  };
}

export async function updateProjectWebhook(
  user: UserRecord,
  codigoProyecto: string,
  webhookUrl: string,
  clientIp: string,
): Promise<ProjectRecord> {
  if (!planGuardService.canUseWebhooks(user.plan.nombre)) {
    throw new ServiceError(
      403,
      'Los Webhooks GitHub/GitLab están disponibles a partir del plan Team IA.',
    );
  }

  const existing = await projectRepository.findByCode(codigoProyecto);
  if (!existing) {
    throw new ServiceError(404, `El proyecto ${codigoProyecto} no existe.`);
  }

  if (
    user.rol !== 'Administrador' &&
    existing.usuario_correo.toLowerCase() !== user.correo.toLowerCase()
  ) {
    throw new ServiceError(403, 'No tienes permisos para modificar este proyecto.');
  }

  const updated = await projectRepository.updateWebhookUrl(
    codigoProyecto,
    webhookUrl,
  );
  if (!updated) {
    throw new ServiceError(404, `El proyecto ${codigoProyecto} no existe.`);
  }

  await auditLogRepository.create({
    usuario: user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'CONFIGURACION_WEBHOOK',
    entidad_afectada: `proyectos (${codigoProyecto})`,
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return updated;
}

export async function updateProjectAccessForUser(params: {
  user: UserRecord;
  codigoProyecto: string;
  permisos_acceso: Array<{ email: string; rol_carpeta: FolderAccessRole }>;
  clientIp: string;
}): Promise<UpdateProjectAccessResponseDTO> {
  const existing = await projectRepository.findByCode(params.codigoProyecto);
  if (!existing) {
    throw new ServiceError(
      404,
      `El proyecto ${params.codigoProyecto} no existe.`,
    );
  }

  const permission = getUserProjectPermission(params.user, existing);
  if (permission !== 'owner_or_admin') {
    await auditLogRepository.create({
      usuario: params.user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'ACTUALIZAR_ACCESOS_CARPETA',
      entidad_afectada: `proyectos (${params.codigoProyecto})`,
      direccion_ip: params.clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'Solo el propietario o un Administrador puede modificar los permisos de esta carpeta.',
    );
  }

  const plan = params.user.plan.nombre;
  if (plan !== 'Team IA' && plan !== 'Enterprise') {
    await auditLogRepository.create({
      usuario: params.user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'ACTUALIZAR_ACCESOS_CARPETA',
      entidad_afectada: `proyectos (${params.codigoProyecto})`,
      direccion_ip: params.clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'El control de accesos por carpeta (ACL) está disponible exclusivamente en Team IA y Enterprise.',
    );
  }

  const existingDates = new Map<string, Date>();
  for (const prev of existing.permisos_acceso ?? []) {
    existingDates.set(prev.email.toLowerCase(), new Date(prev.assigned_at));
  }

  const ownerEmail = existing.usuario_correo.toLowerCase();
  const deduped = new Map<
    string,
    { email: string; rol_carpeta: FolderAccessRole; assigned_at: Date }
  >();

  for (const item of params.permisos_acceso) {
    const email = item.email.toLowerCase().trim();
    if (!email || email === ownerEmail) continue;
    deduped.set(email, {
      email,
      rol_carpeta: item.rol_carpeta,
      assigned_at: existingDates.get(email) ?? new Date(),
    });
  }

  const updated = await projectRepository.updateAccessPermissions(
    existing.codigo_proyecto,
    Array.from(deduped.values()),
  );
  if (!updated) {
    throw new ServiceError(
      404,
      `El proyecto ${params.codigoProyecto} no existe.`,
    );
  }

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'ACTUALIZAR_ACCESOS_CARPETA',
    entidad_afectada: `proyectos (${existing.codigo_proyecto})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return {
    project: updated,
    message: `Permisos de carpeta actualizados (${deduped.size} colaborador(es)).`,
  };
}
