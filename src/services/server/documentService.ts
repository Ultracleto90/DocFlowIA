import {
  getPlanDefinition,
  type ExportFormat,
} from '@/core/constants/plans';
import type {
  GeneratedDocumentRecord,
  UpdateDocumentRequestDTO,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { documentRepository } from '@/infrastructure/repositories/documentRepository';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { ServiceError } from './errors';
import { renderMarkdownToPdf } from './pdfRenderer';
import { planGuardService } from './planGuardService';

const DB_ROLE_WRITE = 'worker_ia_service';
const FREEMIUM_WATERMARK =
  '\n---\n*Generado con DocuFlow AI (Plan Freemium Explorer)*';

function assertObjectId(id: string): void {
  if (!/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new ServiceError(400, 'El identificador del documento es inválido.');
  }
}

function slugifyDocumentType(tipo: string): string {
  return tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function loadAuthorizedDocument(
  user: UserRecord,
  documentId: string,
  clientIp: string,
): Promise<{
  document: GeneratedDocumentRecord;
  projectName: string;
}> {
  assertObjectId(documentId);

  const document = await documentRepository.findById(documentId);
  if (!document) {
    throw new ServiceError(404, 'Documento generado no encontrado.');
  }

  const project = await projectRepository.findByCode(document.codigo_proyecto);
  if (!project) {
    throw new ServiceError(404, 'Proyecto asociado no encontrado.');
  }

  const hasAccess =
    user.rol === 'Administrador' ||
    project.usuario_correo.toLowerCase() === user.correo.toLowerCase();

  if (!hasAccess) {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'INTENTO_ACCESO_DOCUMENTO',
      entidad_afectada: `documentos_generados (${document.codigo_proyecto})`,
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'No tienes permisos para acceder o editar este documento.',
    );
  }

  return {
    document,
    projectName: project.nombre_proyecto,
  };
}

export async function updateDocumentForUser(params: {
  user: UserRecord;
  documentId: string;
  patch: UpdateDocumentRequestDTO;
  clientIp: string;
}): Promise<GeneratedDocumentRecord> {
  const { document } = await loadAuthorizedDocument(
    params.user,
    params.documentId,
    params.clientIp,
  );

  const updated = await documentRepository.updateById(
    params.documentId,
    params.patch,
  );
  if (!updated) {
    throw new ServiceError(404, 'Documento generado no encontrado.');
  }

  const accion =
    params.patch.estado_auditoria === 'validado_humano'
      ? 'VALIDACION_DOCUMENTO'
      : 'EDICION_DOCUMENTO';

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion,
    entidad_afectada: `documentos_generados (${document.codigo_proyecto})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return updated;
}

export interface ExportedDocumentFile {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export async function exportDocumentForUser(params: {
  user: UserRecord;
  documentId: string;
  format: ExportFormat;
  clientIp: string;
}): Promise<ExportedDocumentFile> {
  const { document, projectName } = await loadAuthorizedDocument(
    params.user,
    params.documentId,
    params.clientIp,
  );

  if (
    params.format === 'pdf' &&
    !planGuardService.canExportPdf(params.user.plan.nombre)
  ) {
    await auditLogRepository.create({
      usuario: params.user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'EXPORTACION_PDF_BLOQUEADA',
      entidad_afectada: `documentos_generados (${document.codigo_proyecto})`,
      direccion_ip: params.clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });

    throw new ServiceError(
      403,
      'La exportación en PDF está bloqueada en el plan Freemium. Actualiza a Pro ($399 MXN/mes).',
      { code: 'PDF_LOCKED', plan: params.user.plan.nombre },
    );
  }

  const planDef = getPlanDefinition(params.user.plan.nombre);
  const isWhiteLabel =
    params.user.plan.nombre === 'Enterprise' &&
    Boolean(params.user.white_label?.enabled) &&
    Boolean(params.user.white_label?.brand_name?.trim());

  const brandName = isWhiteLabel
    ? params.user.white_label!.brand_name.trim()
    : undefined;

  const baseSlug = slugifyDocumentType(document.tipo_documento);
  const filename = `${document.codigo_proyecto}_${baseSlug}.${params.format}`;

  if (params.format === 'md') {
    let markdownOutput = document.contenido_markdown;

    if (brandName) {
      markdownOutput = `> **${brandName}** — Documentación Técnica Corporativa (${document.codigo_proyecto})\n\n${markdownOutput}`;
    }

    if (planDef.marca_agua_md) {
      markdownOutput = `${markdownOutput}${FREEMIUM_WATERMARK}`;
    }

    await auditLogRepository.create({
      usuario: params.user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: 'EXPORTACION_MD',
      entidad_afectada: `documentos_generados (${document.codigo_proyecto})`,
      direccion_ip: params.clientIp,
      resultado: 'EXITOSO',
    });

    return {
      buffer: Buffer.from(markdownOutput, 'utf8'),
      contentType: 'text/markdown; charset=utf-8',
      filename,
    };
  }

  const pdfBuffer = await renderMarkdownToPdf({
    title: `${document.tipo_documento}`,
    subtitle: `${projectName} · ${document.modelo_ia}`,
    codigoProyecto: document.codigo_proyecto,
    estadoAuditoria: document.estado_auditoria,
    brandHeader: brandName,
    markdown: document.contenido_markdown,
  });

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'EXPORTACION_PDF',
    entidad_afectada: `documentos_generados (${document.codigo_proyecto})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return {
    buffer: pdfBuffer,
    contentType: 'application/pdf',
    filename,
  };
}
