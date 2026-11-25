import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import { getPlanDefinition } from '@/core/constants/plans';
import type {
  BundleArtifactKey,
  FilesExplorerResponseDTO,
  ProjectFolderSummary,
  ProjectRecord,
  ProjectSecurityResponseDTO,
  ProjectTopologyResponseDTO,
  ProjectVirtualFileItem,
  UserRecord,
} from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { documentRepository } from '@/infrastructure/repositories/documentRepository';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { ServiceError } from './errors';
import { ensureProjectTopology } from './topologyService';

const DB_ROLE_WRITE = 'worker_ia_service';
const FREEMIUM_WATERMARK =
  '\n---\n*Generado con DocuFlow AI (Plan Freemium Explorer)*';

function assertProjectAccess(user: UserRecord, project: ProjectRecord): boolean {
  return (
    user.rol === 'Administrador' ||
    project.usuario_correo.toLowerCase() === user.correo.toLowerCase()
  );
}

function slugifyType(tipo: string): string {
  return tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function getAuthorizedProject(
  user: UserRecord,
  codigoProyecto: string,
  clientIp: string,
  auditAction: string,
): Promise<ProjectRecord> {
  const project = await projectRepository.findByCode(codigoProyecto);
  if (!project) {
    throw new ServiceError(404, `El proyecto ${codigoProyecto} no existe.`);
  }

  if (!assertProjectAccess(user, project)) {
    await auditLogRepository.create({
      usuario: user.correo,
      rol_bd: DB_ROLE_WRITE,
      accion: auditAction,
      entidad_afectada: `proyectos (${codigoProyecto})`,
      direccion_ip: clientIp,
      resultado: 'BLOQUEADO_UNAUTHORIZED',
    });
    throw new ServiceError(
      403,
      'No tienes permisos para acceder a este proyecto.',
    );
  }

  return project;
}

export async function getProjectTopologyForUser(
  user: UserRecord,
  codigoProyecto: string,
  clientIp: string,
): Promise<ProjectTopologyResponseDTO> {
  const project = await getAuthorizedProject(
    user,
    codigoProyecto,
    clientIp,
    'INTENTO_ACCESO_TOPOLOGIA',
  );
  const topology = await ensureProjectTopology(project);
  return { topology };
}

export async function getProjectSecurityForUser(
  user: UserRecord,
  codigoProyecto: string,
  clientIp: string,
): Promise<ProjectSecurityResponseDTO> {
  const project = await getAuthorizedProject(
    user,
    codigoProyecto,
    clientIp,
    'INTENTO_ACCESO_SEGURIDAD',
  );
  const topology = await ensureProjectTopology(project);
  const unlocked =
    user.plan.nombre === 'Team IA' || user.plan.nombre === 'Enterprise';

  await auditLogRepository.create({
    usuario: user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'CONSULTA_SEGURIDAD_PROYECTO',
    entidad_afectada: `topologias_proyecto (${codigoProyecto})`,
    direccion_ip: clientIp,
    resultado: 'EXITOSO',
  });

  return {
    codigo_proyecto: project.codigo_proyecto,
    nombre_proyecto: project.nombre_proyecto,
    plan_actual: user.plan.nombre,
    unlocked,
    report: topology.security_report,
    updated_at: topology.updated_at,
  };
}

export interface ExportedArtifactBinary {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

export async function exportProjectBundleOrArtifact(params: {
  user: UserRecord;
  codigoProyecto: string;
  artifact: BundleArtifactKey;
  clientIp: string;
}): Promise<ExportedArtifactBinary> {
  const project = await getAuthorizedProject(
    params.user,
    params.codigoProyecto,
    params.clientIp,
    'INTENTO_DESCARGA_KIT',
  );
  const codigo = project.codigo_proyecto;
  const topology = await ensureProjectTopology(project);

  if (params.artifact === 'topology_md') {
    return {
      buffer: Buffer.from(topology.topology_markdown, 'utf8'),
      contentType: 'text/markdown; charset=utf-8',
      filename: `${codigo}_TOPOLOGY.md`,
    };
  }

  if (params.artifact === 'project_map_json') {
    return {
      buffer: Buffer.from(topology.project_map_json, 'utf8'),
      contentType: 'application/json; charset=utf-8',
      filename: `${codigo}_project-map.json`,
    };
  }

  if (params.artifact === 'llms_txt') {
    return {
      buffer: Buffer.from(topology.llms_txt, 'utf8'),
      contentType: 'text/plain; charset=utf-8',
      filename: `${codigo}_llms.txt`,
    };
  }

  if (params.artifact === 'security_md') {
    return {
      buffer: Buffer.from(topology.security_report.security_markdown, 'utf8'),
      contentType: 'text/markdown; charset=utf-8',
      filename: `${codigo}_SECURITY_REPORT.md`,
    };
  }

  if (params.artifact === 'source_zip') {
    try {
      const zipBuffer = await fs.readFile(project.archivo_zip);
      return {
        buffer: zipBuffer,
        contentType: 'application/zip',
        filename: `${codigo}_fuente_laravel.zip`,
      };
    } catch {
      throw new ServiceError(
        404,
        'El paquete .zip original de este proyecto semilla no está en almacenamiento físico.',
      );
    }
  }

  // Full Project Kit (.zip)
  const documents = await documentRepository.findByProjectCode(codigo);
  const planDef = getPlanDefinition(params.user.plan.nombre);
  const isWhiteLabel =
    params.user.plan.nombre === 'Enterprise' &&
    Boolean(params.user.white_label?.enabled) &&
    Boolean(params.user.white_label?.brand_name?.trim());
  const brandName = isWhiteLabel
    ? params.user.white_label!.brand_name.trim()
    : undefined;

  const kitZip = new AdmZip();

  for (const doc of documents) {
    let md = doc.contenido_markdown;
    if (brandName) {
      md = `> **${brandName}** - Documentación Técnica Corporativa (${codigo})\n\n${md}`;
    }
    if (planDef.marca_agua_md) {
      md = `${md}${FREEMIUM_WATERMARK}`;
    }
    const filename = `manuales/${codigo}_${slugifyType(doc.tipo_documento)}.md`;
    kitZip.addFile(filename, Buffer.from(md, 'utf8'));
  }

  kitZip.addFile(
    'ia-context/TOPOLOGY.md',
    Buffer.from(topology.topology_markdown, 'utf8'),
  );
  kitZip.addFile(
    'ia-context/project-map.json',
    Buffer.from(topology.project_map_json, 'utf8'),
  );
  kitZip.addFile('ia-context/llms.txt', Buffer.from(topology.llms_txt, 'utf8'));
  kitZip.addFile(
    'seguridad/SECURITY_REPORT.md',
    Buffer.from(topology.security_report.security_markdown, 'utf8'),
  );

  await auditLogRepository.create({
    usuario: params.user.correo,
    rol_bd: DB_ROLE_WRITE,
    accion: 'DESCARGA_KIT_PROYECTO',
    entidad_afectada: `proyectos (${codigo})`,
    direccion_ip: params.clientIp,
    resultado: 'EXITOSO',
  });

  return {
    buffer: kitZip.toBuffer(),
    contentType: 'application/zip',
    filename: `${codigo}_kit_completo.zip`,
  };
}

export async function listFilesExplorerForUser(
  user: UserRecord,
): Promise<FilesExplorerResponseDTO> {
  const projects =
    user.rol === 'Administrador'
      ? await projectRepository.findAll()
      : await projectRepository.findByUserEmail(user.correo);

  const folders: ProjectFolderSummary[] = await Promise.all(
    projects.map(async (project) => {
      const [topology, documents, zipStat] = await Promise.all([
        ensureProjectTopology(project),
        documentRepository.findByProjectCode(project.codigo_proyecto),
        fs.stat(project.archivo_zip).catch(() => null),
      ]);

      const sourceZipExists = Boolean(zipStat && zipStat.isFile());
      const codigo = project.codigo_proyecto;
      const securityUnlocked =
        user.plan.nombre === 'Team IA' || user.plan.nombre === 'Enterprise';

      const docFiles: ProjectVirtualFileItem[] = documents.map((doc) => ({
        id: `${codigo}:doc:${doc.id}`,
        filename: `${codigo}_${slugifyType(doc.tipo_documento)}.md`,
        label: doc.tipo_documento,
        category: 'manual',
        extension: 'md',
        size_bytes: Buffer.byteLength(doc.contenido_markdown, 'utf8'),
        available: true,
        status_label:
          doc.estado_auditoria === 'validado_humano'
            ? 'Validado QA'
            : 'Borrador IA',
        document_id: doc.id,
      }));

      const files: ProjectVirtualFileItem[] = [
        {
          id: `${codigo}:kit`,
          filename: `${codigo}_kit_completo.zip`,
          label: 'Kit Completo del Proyecto (Manuales + Topología IA + Seguridad)',
          category: 'kit_bundle',
          extension: 'zip',
          size_bytes:
            Buffer.byteLength(topology.topology_markdown, 'utf8') +
            Buffer.byteLength(topology.project_map_json, 'utf8') +
            Buffer.byteLength(topology.llms_txt, 'utf8') +
            Buffer.byteLength(topology.security_report.security_markdown, 'utf8') +
            documents.reduce(
              (acc, doc) => acc + Buffer.byteLength(doc.contenido_markdown, 'utf8'),
              0,
            ),
          available: true,
          status_label: 'Listo para descargar',
          artifact_key: 'kit',
        },
        {
          id: `${codigo}:source_zip`,
          filename:
            project.archivo_zip.split('/').pop() ?? `${codigo}_fuente.zip`,
          label: 'Paquete Laravel Original (.zip)',
          category: 'zip_original',
          extension: 'zip',
          size_bytes: zipStat?.size ?? 0,
          available: sourceZipExists,
          status_label: sourceZipExists ? 'Archivo físico' : 'Referencia semilla',
          artifact_key: 'source_zip',
        },
        ...docFiles,
        {
          id: `${codigo}:topology_md`,
          filename: `${codigo}_TOPOLOGY.md`,
          label: 'Mapa Arquitectónico Markdown para Agentes IA',
          category: 'topologia_ia',
          extension: 'md',
          size_bytes: Buffer.byteLength(topology.topology_markdown, 'utf8'),
          available: true,
          status_label: `${topology.metrics.total_nodes} nodos`,
          artifact_key: 'topology_md',
        },
        {
          id: `${codigo}:project_map_json`,
          filename: `${codigo}_project-map.json`,
          label: 'Grafo Estructurado JSON (nodes & edges)',
          category: 'topologia_ia',
          extension: 'json',
          size_bytes: Buffer.byteLength(topology.project_map_json, 'utf8'),
          available: true,
          status_label: `${topology.metrics.total_edges} enlaces`,
          artifact_key: 'project_map_json',
        },
        {
          id: `${codigo}:llms_txt`,
          filename: `${codigo}_llms.txt`,
          label: 'Contexto Estándar llms.txt para LLM / Agentes',
          category: 'topologia_ia',
          extension: 'txt',
          size_bytes: Buffer.byteLength(topology.llms_txt, 'utf8'),
          available: true,
          status_label: 'Listo para agente',
          artifact_key: 'llms_txt',
        },
        {
          id: `${codigo}:security_md`,
          filename: `${codigo}_SECURITY_REPORT.md`,
          label: 'Reporte Estático Blade + Matriz STRIDE',
          category: 'seguridad',
          extension: 'md',
          size_bytes: Buffer.byteLength(
            topology.security_report.security_markdown,
            'utf8',
          ),
          available: securityUnlocked,
          status_label: securityUnlocked
            ? `${topology.security_report.summary.total_findings} hallazgos`
            : 'Requiere Team IA',
          artifact_key: 'security_md',
        },
      ];

      return {
        project,
        source_zip_exists: sourceZipExists,
        total_files: files.length,
        files,
      };
    }),
  );

  const total_artifacts = folders.reduce(
    (sum, folder) => sum + folder.total_files,
    0,
  );

  return {
    folders,
    total_projects: folders.length,
    total_artifacts,
  };
}
