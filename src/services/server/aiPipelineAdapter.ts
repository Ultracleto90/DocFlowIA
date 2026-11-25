import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import {
  getPlanDefinition,
  type DocumentType,
  type PlanDefinition,
} from '@/core/constants/plans';
import type {
  FilteredComponentRecord,
  GeneratedDocumentRecord,
  ProjectIngestionSummary,
  ProjectRecord,
  UserRecord,
} from '@/core/types';
import {
  componentRepository,
  type CreateFilteredComponentInput,
} from '@/infrastructure/repositories/componentRepository';
import {
  documentRepository,
  type CreateDocumentInput,
} from '@/infrastructure/repositories/documentRepository';
import { projectRepository } from '@/infrastructure/repositories/projectRepository';
import { topologyRepository } from '@/infrastructure/repositories/topologyRepository';
import {
  analyzeBladeContent,
  assertNoZipSlip,
  isRelevantBladeEntry,
  normalizeZipPath,
  type AnalyzedBladeView,
  type BladeSourceEntry,
} from './bladeAnalyzer';
import { ServiceError } from './errors';
import { planGuardService } from './planGuardService';
import { buildAndPersistTopologyFromViews } from './topologyService';

export interface ProcessProjectZipParams {
  codigo_proyecto: string;
  nombre_proyecto: string;
  framework: string;
  user: UserRecord;
  fileName: string;
  zipBuffer: Buffer;
}

export interface ProcessProjectZipResult {
  project: ProjectRecord;
  components: FilteredComponentRecord[];
  documents: GeneratedDocumentRecord[];
  summary: ProjectIngestionSummary;
}

function getUploadsDir(): string {
  return process.env.UPLOADS_DIR?.trim() || '/storage/uploads';
}

async function unlinkSafe(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors if file does not exist
  }
}

function buildOptionalEnterpriseSections(
  plan: PlanDefinition,
  relevantViews: AnalyzedBladeView[],
): string {
  const sections: string[] = [];

  if (plan.features.blade_wcag_audit) {
    const wcagWarnings = relevantViews
      .filter((v) => v.hasMissingAltOrLabel)
      .map(
        (v) =>
          `- **${v.archivo_blade}**: Posibles \`<img>\` sin atributo \`alt\` o \`<input>\` sin \`<label>\` / \`aria-label\`.`,
      );

    sections.push(
      [
        '## Auditoría Blade / Tailwind & WCAG 2.1',
        wcagWarnings.length > 0
          ? wcagWarnings.join('\n')
          : '- Sin hallazgos críticos de accesibilidad WCAG 2.1 en las vistas analizadas.',
      ].join('\n\n'),
    );
  }

  if (plan.features.owasp_audit) {
    const owaspFindings: string[] = [];
    for (const view of relevantViews) {
      if (view.hasUnescapedBlade) {
        owaspFindings.push(
          `- **[XSS / OWASP A03]** \`${view.archivo_blade}\`: Uso detectado de sintaxis sin escape \`{!! ... !!}\`.`,
        );
      }
      if (view.hasFormWithoutCsrf) {
        owaspFindings.push(
          `- **[CSRF / OWASP A01]** \`${view.archivo_blade}\`: Formulario \`POST\` sin directiva \`@csrf\`.`,
        );
      }
    }

    sections.push(
      [
        '## Auditoría de Seguridad OWASP & Cumplimiento CMMI/ISO 9001',
        owaspFindings.length > 0
          ? owaspFindings.join('\n')
          : '- Controles CSRF (`@csrf`) y escape Blade (`{{ }}`) verificados sin alertas críticas.',
      ].join('\n\n'),
    );
  }

  return sections.length > 0 ? `\n\n${sections.join('\n\n')}` : '';
}

function generateDocumentMarkdown(
  tipo: DocumentType,
  params: {
    codigo_proyecto: string;
    nombre_proyecto: string;
    framework: string;
    plan: PlanDefinition;
    views: AnalyzedBladeView[];
  },
): string {
  const relevant = params.views.filter((v) => v.etiqueta_svm === 1);
  const noise = params.views.filter((v) => v.etiqueta_svm === 0);
  const extraAudit = buildOptionalEnterpriseSections(params.plan, relevant);

  if (tipo === 'Historias de Usuario (INVEST)') {
    const stories = relevant.map((view, idx) => {
      const huCode = `HU-${String(idx + 1).padStart(2, '0')}`;
      const tags = view.elementos_detectados.join(', ');
      return [
        `### ${huCode}: Operación en \`${view.ruta_web}\``,
        `- **Vista Blade:** \`${view.archivo_blade}\``,
        `- **Elementos funcionales detectados:** ${tags}`,
        `- **Narrativa:** Como usuario del sistema **${params.nombre_proyecto}**, quiero interactuar con la vista \`${view.ruta_web}\` para completar el flujo asociado de forma segura en ${params.framework}.`,
        `- **Criterios de Aceptación:**`,
        `  1. La ruta \`${view.ruta_web}\` renderiza los controles requeridos (${tags}).`,
        `  2. Se validan los datos de entrada y la sesión antes de persistir cambios.`,
      ].join('\n');
    });

    return (
      [
        `# Historias de Usuario (INVEST) - ${params.nombre_proyecto} (${params.codigo_proyecto})`,
        `**Framework:** ${params.framework} | **Modelo IA:** ${params.plan.modelo_ia} (${params.plan.nivel_ia}) | **Vistas relevantes:** ${relevant.length} de ${params.views.length}`,
        stories.length > 0
          ? stories.join('\n\n')
          : 'No se detectaron vistas funcionales interactivas; revisa el filtro SVM.',
      ].join('\n\n') + extraAudit
    );
  }

  if (tipo === 'Manual Técnico (IEEE 830)') {
    const tableRows = params.views
      .map(
        (v) =>
          `| \`${v.archivo_blade}\` | \`${v.ruta_web}\` | ${v.clasificacion} (SVM=${v.etiqueta_svm}) | ${v.elementos_detectados.join(', ')} |`,
      )
      .join('\n');

    return (
      [
        `# Especificación de Requisitos y Manual Técnico (IEEE 830) - ${params.nombre_proyecto}`,
        `## 1. Identificación del Proyecto`,
        `- **Código:** ${params.codigo_proyecto}\n- **Stack detectado:** ${params.framework} (.blade.php)\n- **Cobertura SVM:** ${relevant.length} vistas relevantes / ${noise.length} vistas de ruido visual descartadas.`,
        `## 2. Inventario Arquitectónico de Vistas Blade`,
        `| Archivo Blade | Ruta Web | Clasificación SVM | Elementos Detectados |\n| :--- | :--- | :--- | :--- |\n${tableRows}`,
        `## 3. Contratos de Seguridad y Validación`,
        relevant.some((v) => v.elementos_detectados.includes('directive_csrf'))
          ? '- Se detectó protección `@csrf` en formularios Blade del proyecto.'
          : '- Verificar inclusión explícita de tokens `@csrf` en endpoints de mutación.',
      ].join('\n\n') + extraAudit
    );
  }

  const guides = relevant.map((view, idx) => {
    return [
      `### ${idx + 1}. Módulo \`${view.ruta_web}\``,
      `1. Navegue hacia la sección **${view.ruta_web}** desde el menú principal de **${params.nombre_proyecto}**.`,
      `2. Utilice los controles disponibles en pantalla (\`${view.elementos_detectados.join('`, `')}\`) para ingresar o consultar la información.`,
      `3. Confirme la acción mediante el botón de envío para guardar los cambios en el sistema.`,
    ].join('\n');
  });

  return (
    [
      `# Manual de Usuario (ISO 26514) - ${params.nombre_proyecto} (${params.codigo_proyecto})`,
      `Guía operativa generada automáticamente a partir de las ${relevant.length} vistas funcionales detectadas en ${params.framework}.`,
      guides.length > 0
        ? guides.join('\n\n')
        : 'No se identificaron flujos interactivos para documentar en el manual de usuario.',
    ].join('\n\n') + extraAudit
  );
}

export async function processProjectZip(
  params: ProcessProjectZipParams,
): Promise<ProcessProjectZipResult> {
  if (!params.fileName.toLowerCase().endsWith('.zip')) {
    throw new ServiceError(
      400,
      'Solo se permiten archivos comprimidos con extensión .zip.',
    );
  }

  let zip: AdmZip;
  try {
    zip = new AdmZip(params.zipBuffer);
  } catch {
    throw new ServiceError(
      400,
      'El archivo .zip está dañado o tiene un formato inválido.',
    );
  }

  const allEntries = zip.getEntries();
  assertNoZipSlip(allEntries);

  const bladeEntries = allEntries.filter(isRelevantBladeEntry);

  const uploadsDir = getUploadsDir();
  await fs.mkdir(uploadsDir, { recursive: true });
  const savedZipPath = path.join(
    uploadsDir,
    `${params.codigo_proyecto}_${Date.now()}.zip`,
  );

  await fs.writeFile(savedZipPath, params.zipBuffer);

  try {
    planGuardService.checkBladeViewCount(
      params.user.plan.nombre,
      bladeEntries.length,
    );
  } catch (err: unknown) {
    await unlinkSafe(savedZipPath);
    throw err;
  }

  const createdProject = await projectRepository.create({
    codigo_proyecto: params.codigo_proyecto,
    nombre_proyecto: params.nombre_proyecto,
    usuario_correo: params.user.correo,
    archivo_zip: savedZipPath,
    framework: params.framework,
    estado_procesamiento: 'pendiente',
  });

  try {
    await projectRepository.updateStatus(
      params.codigo_proyecto,
      'filtrando_svm',
    );

    const bladeSources: BladeSourceEntry[] = [];
    const analyzedViews: AnalyzedBladeView[] = bladeEntries.map((entry) => {
      const normalizedPath = normalizeZipPath(entry.entryName);
      const content = entry.getData().toString('utf8');
      const analyzed = analyzeBladeContent(normalizedPath, content);
      bladeSources.push({
        archivo_blade: analyzed.archivo_blade,
        ruta_web: analyzed.ruta_web,
        content,
        etiqueta_svm: analyzed.etiqueta_svm,
        elementos_detectados: analyzed.elementos_detectados,
        clasificacion: analyzed.clasificacion,
      });
      return analyzed;
    });

    const componentInputs: CreateFilteredComponentInput[] = analyzedViews.map(
      (v) => ({
        codigo_proyecto: params.codigo_proyecto,
        archivo_blade: v.archivo_blade,
        ruta_web: v.ruta_web,
        elementos_detectados: v.elementos_detectados,
        etiqueta_svm: v.etiqueta_svm,
        clasificacion: v.clasificacion,
      }),
    );

    const components = await componentRepository.insertMany(componentInputs);

    await projectRepository.updateStatus(
      params.codigo_proyecto,
      'redactando_ia',
    );

    const planDef = getPlanDefinition(params.user.plan.nombre);
    const deliverables = planGuardService.getUnlockedDeliverables(
      params.user.plan.nombre,
    );

    const documentInputs: CreateDocumentInput[] = deliverables.map((tipo) => {
      const markdown = generateDocumentMarkdown(tipo, {
        codigo_proyecto: params.codigo_proyecto,
        nombre_proyecto: params.nombre_proyecto,
        framework: params.framework,
        plan: planDef,
        views: analyzedViews,
      });

      return {
        codigo_proyecto: params.codigo_proyecto,
        tipo_documento: tipo,
        estado_auditoria: 'borrador_ia',
        token_count: Math.max(150, Math.ceil(markdown.length / 3.8)),
        modelo_ia: planDef.modelo_ia,
        contenido_markdown: markdown,
      };
    });

    const documents = await documentRepository.createMany(documentInputs);

    await buildAndPersistTopologyFromViews({
      codigo_proyecto: params.codigo_proyecto,
      nombre_proyecto: params.nombre_proyecto,
      framework: params.framework,
      source_mode: 'zip',
      views: bladeSources,
      documents,
    });

    const completedProject = await projectRepository.updateStatus(
      params.codigo_proyecto,
      'completado',
    );

    const relevantCount = analyzedViews.filter(
      (v) => v.etiqueta_svm === 1,
    ).length;
    const noiseCount = analyzedViews.length - relevantCount;

    return {
      project: completedProject ?? createdProject,
      components,
      documents,
      summary: {
        total_blade_views: analyzedViews.length,
        relevant_views: relevantCount,
        noise_views: noiseCount,
        documents_generated: documents.length,
      },
    };
  } catch (err: unknown) {
    await componentRepository.deleteByProjectCode(params.codigo_proyecto);
    await documentRepository.deleteByProjectCode(params.codigo_proyecto);
    await topologyRepository.deleteByProjectCode(params.codigo_proyecto);
    await projectRepository.deleteByCode(params.codigo_proyecto);
    await unlinkSafe(savedZipPath);
    throw err;
  }
}
