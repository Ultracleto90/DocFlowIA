import fs from 'node:fs/promises';
import type {
  CreateProjectResponseDTO,
  DeleteProjectResponseDTO,
  ProjectDetailResponseDTO,
  ProjectListResponseDTO,
  ProjectRecord,
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

function assertProjectAccess(user: UserRecord, project: ProjectRecord): boolean {
  return (
    user.rol === 'Administrador' ||
    project.usuario_correo.toLowerCase() === user.correo.toLowerCase()
  );
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

  if (!assertProjectAccess(user, project)) {
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

  if (!assertProjectAccess(user, existing)) {
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
