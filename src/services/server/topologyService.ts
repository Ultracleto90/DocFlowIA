import fs from 'node:fs/promises';
import AdmZip from 'adm-zip';
import type {
  GeneratedDocumentRecord,
  ProjectRecord,
  ProjectTopologyRecord,
  TopologyEdge,
  TopologyMetrics,
  TopologyNode,
  TopologySourceMode,
} from '@/core/types';
import { componentRepository } from '@/infrastructure/repositories/componentRepository';
import { documentRepository } from '@/infrastructure/repositories/documentRepository';
import { topologyRepository } from '@/infrastructure/repositories/topologyRepository';
import {
  analyzeBladeContent,
  assertNoZipSlip,
  isRelevantBladeEntry,
  normalizeZipPath,
  type BladeSourceEntry,
} from './bladeAnalyzer';
import { scanBladeViewsSecurity } from './securityScannerService';

function resolveDotViewToPath(dotName: string): string {
  const clean = dotName.trim().replace(/^['"]|['"]$/g, '').replace(/\./g, '/');
  return `resources/views/${clean}.blade.php`;
}

function shortLabelFromPath(filePath: string): string {
  const marker = 'resources/views/';
  const idx = filePath.toLowerCase().indexOf(marker);
  const rel = idx >= 0 ? filePath.slice(idx + marker.length) : filePath;
  return rel.replace(/\.blade\.php$/i, '');
}

function extractTopologyGraph(views: BladeSourceEntry[]): {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  metrics: TopologyMetrics;
} {
  const nodeMap = new Map<string, TopologyNode>();
  const edgeMap = new Map<string, TopologyEdge>();

  function addNode(node: TopologyNode) {
    const existing = nodeMap.get(node.id);
    if (!existing) {
      nodeMap.set(node.id, node);
      return;
    }
    nodeMap.set(node.id, {
      ...existing,
      ...node,
      elements: node.elements ?? existing.elements,
      csrf_protected: node.csrf_protected ?? existing.csrf_protected,
    });
  }

  function addEdge(edge: Omit<TopologyEdge, 'id'>) {
    const id = `${edge.source}__${edge.relation}__${edge.target}`;
    if (!edgeMap.has(id)) {
      edgeMap.set(id, { id, ...edge });
    }
  }

  // First register all concrete Blade view files from the project
  for (const view of views) {
    const viewId = `view:${view.archivo_blade}`;
    const lowerPath = view.archivo_blade.toLowerCase();
    const isLayout = /(^|\/)layouts?\//i.test(lowerPath);
    const isPartial =
      /(^|\/)(partials?|includes?|footer|header|navbar|sidebar)/i.test(lowerPath);
    const isComponent = /(^|\/)components?\//i.test(lowerPath);

    const viewType: TopologyNode['type'] = isLayout
      ? 'layout'
      : isPartial
        ? 'partial'
        : isComponent
          ? 'component'
          : 'view';

    const hasCsrf = view.elementos_detectados.includes('directive_csrf');

    addNode({
      id: viewId,
      type: viewType,
      label: shortLabelFromPath(view.archivo_blade),
      file_path: view.archivo_blade,
      svm_classification: view.clasificacion,
      elements: view.elementos_detectados,
      csrf_protected: hasCsrf,
    });

    if (view.ruta_web && view.ruta_web !== 'N/A') {
      const routeId = `route:GET:${view.ruta_web}`;
      addNode({
        id: routeId,
        type: 'route',
        label: `GET ${view.ruta_web}`,
        route_path: view.ruta_web,
        http_method: 'GET',
      });
      addEdge({
        source: routeId,
        target: viewId,
        relation: 'renders',
        label: 'renderiza',
      });
    }
  }

  // Second pass: inspect Blade directives & relationships
  for (const view of views) {
    const viewId = `view:${view.archivo_blade}`;
    const content = view.content;
    if (!content) {
      // Fallback relationships from metadata if binary zip is missing
      if (view.elementos_detectados.includes('form') && view.ruta_web !== 'N/A') {
        const endpointId = `endpoint:POST:${view.ruta_web}`;
        addNode({
          id: endpointId,
          type: 'endpoint',
          label: `POST ${view.ruta_web}`,
          route_path: view.ruta_web,
          http_method: 'POST',
          csrf_protected: view.elementos_detectados.includes('directive_csrf'),
        });
        addEdge({
          source: viewId,
          target: endpointId,
          relation: 'submits_to',
          label: 'envía form',
        });
      }
      continue;
    }

    // @extends('layouts.app')
    const extendsRegex = /@extends\s*\(\s*['"]([^'"]+)['"]\s*\)/gi;
    let m: RegExpExecArray | null;
    while ((m = extendsRegex.exec(content)) !== null) {
      const layoutPath = resolveDotViewToPath(m[1]);
      const layoutId = `view:${layoutPath}`;
      addNode({
        id: layoutId,
        type: 'layout',
        label: shortLabelFromPath(layoutPath),
        file_path: layoutPath,
      });
      addEdge({
        source: viewId,
        target: layoutId,
        relation: 'extends',
        label: '@extends',
      });
    }

    // @include / @includeIf / @each
    const includeRegex =
      /@(?:include|includeIf|includeWhen|each)\s*\(\s*['"]([^'"]+)['"]/gi;
    while ((m = includeRegex.exec(content)) !== null) {
      const partialPath = resolveDotViewToPath(m[1]);
      const partialId = `view:${partialPath}`;
      addNode({
        id: partialId,
        type: 'partial',
        label: shortLabelFromPath(partialPath),
        file_path: partialPath,
      });
      addEdge({
        source: viewId,
        target: partialId,
        relation: 'includes',
        label: '@include',
      });
    }

    // @component('...') or <x-component-name>
    const componentDirRegex = /@component\s*\(\s*['"]([^'"]+)['"]/gi;
    while ((m = componentDirRegex.exec(content)) !== null) {
      const compPath = resolveDotViewToPath(m[1]);
      const compId = `view:${compPath}`;
      addNode({
        id: compId,
        type: 'component',
        label: shortLabelFromPath(compPath),
        file_path: compPath,
      });
      addEdge({
        source: viewId,
        target: compId,
        relation: 'uses_component',
        label: '@component',
      });
    }

    const bladeTagRegex = /<x-([a-z0-9_.:-]+)/gi;
    while ((m = bladeTagRegex.exec(content)) !== null) {
      const compName = m[1];
      if (compName === 'slot') continue;
      const compId = `component:x-${compName}`;
      addNode({
        id: compId,
        type: 'component',
        label: `<x-${compName}>`,
        file_path: `resources/views/components/${compName.replace(/\./g, '/')}.blade.php`,
      });
      addEdge({
        source: viewId,
        target: compId,
        relation: 'uses_component',
        label: 'componente Blade',
      });
    }

    // <form method="..." action="...">
    const formTargetsInView = new Set<string>();
    const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
    while ((m = formRegex.exec(content)) !== null) {
      const attrs = m[1] ?? '';
      const body = m[2] ?? '';

      const methodOverride = /@method\s*\(\s*['"]([^'"]+)['"]\s*\)/i.exec(body);
      const htmlMethod = /\bmethod\s*=\s*['"]([^'"]+)['"]/i.exec(attrs);
      const httpMethod = (
        methodOverride?.[1] ??
        htmlMethod?.[1] ??
        'GET'
      ).toUpperCase();

      const actionMatch = /\baction\s*=\s*['"]([^'"]+)['"]/i.exec(attrs);
      let actionLabel = view.ruta_web !== 'N/A' ? view.ruta_web : '/form';
      if (actionMatch) {
        const rawAction = actionMatch[1];
        const routeCall = /route\s*\(\s*['"]([^'"]+)['"]/i.exec(rawAction);
        const urlCall = /url\s*\(\s*['"]([^'"]+)['"]/i.exec(rawAction);
        actionLabel = routeCall
          ? `route:${routeCall[1]}`
          : urlCall
            ? urlCall[1]
            : rawAction;
      }

      const hasCsrf = /@csrf\b|csrf_field\s*\(/i.test(body);
      const endpointId = `endpoint:${httpMethod}:${actionLabel}`;
      formTargetsInView.add(actionLabel);

      addNode({
        id: endpointId,
        type: 'endpoint',
        label: `${httpMethod} ${actionLabel}`,
        route_path: actionLabel,
        http_method: httpMethod,
        csrf_protected: hasCsrf,
      });
      addEdge({
        source: viewId,
        target: endpointId,
        relation: 'submits_to',
        label: hasCsrf ? `${httpMethod} (@csrf)` : `${httpMethod} (sin @csrf)`,
      });
    }

    // Standalone route('...') calls outside form actions
    const routeCallRegex = /route\s*\(\s*['"]([^'"]+)['"]\s*(?:,|\))/gi;
    while ((m = routeCallRegex.exec(content)) !== null) {
      const routeName = `route:${m[1]}`;
      if (formTargetsInView.has(routeName)) continue;
      const endpointId = `endpoint:GET:${routeName}`;
      addNode({
        id: endpointId,
        type: 'endpoint',
        label: `GET ${routeName}`,
        route_path: routeName,
        http_method: 'GET',
      });
      addEdge({
        source: viewId,
        target: endpointId,
        relation: 'links_to',
        label: 'route()',
      });
    }

    // Static internal <a href="/...">
    const linkRegex = /<a\b[^>]*\bhref\s*=\s*['"](\/[a-zA-Z0-9_/-]*)['"]/gi;
    while ((m = linkRegex.exec(content)) !== null) {
      const pathHref = m[1];
      const endpointId = `endpoint:GET:${pathHref}`;
      addNode({
        id: endpointId,
        type: 'endpoint',
        label: `GET ${pathHref}`,
        route_path: pathHref,
        http_method: 'GET',
      });
      addEdge({
        source: viewId,
        target: endpointId,
        relation: 'links_to',
        label: 'enlace',
      });
    }
  }

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  const metrics: TopologyMetrics = {
    total_nodes: nodes.length,
    total_edges: edges.length,
    routes_count: nodes.filter((n) => n.type === 'route').length,
    views_count: nodes.filter((n) => n.type === 'view').length,
    partials_layouts_count: nodes.filter((n) =>
      ['layout', 'partial', 'component'].includes(n.type),
    ).length,
    endpoints_count: nodes.filter((n) => n.type === 'endpoint').length,
  };

  return { nodes, edges, metrics };
}

function buildAiArtifacts(params: {
  codigo_proyecto: string;
  nombre_proyecto: string;
  framework: string;
  source_mode: TopologySourceMode;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  metrics: TopologyMetrics;
  views: BladeSourceEntry[];
  documents: GeneratedDocumentRecord[];
  securitySummary: {
    posture: string;
    total_findings: number;
    forms_total: number;
    forms_with_csrf: number;
  };
}): {
  topology_markdown: string;
  project_map_json: string;
  llms_txt: string;
} {
  const {
    codigo_proyecto,
    nombre_proyecto,
    framework,
    source_mode,
    nodes,
    edges,
    metrics,
    views,
    documents,
    securitySummary,
  } = params;

  const flowLines = edges.map((edge) => {
    const src = nodes.find((n) => n.id === edge.source)?.label ?? edge.source;
    const tgt = nodes.find((n) => n.id === edge.target)?.label ?? edge.target;
    return `- \`${src}\` -> (${edge.label}) -> \`${tgt}\``;
  });

  const viewRows = views.map(
    (v) =>
      `| \`${v.archivo_blade}\` | \`${v.ruta_web}\` | ${v.clasificacion} | ${v.elementos_detectados.join(', ')} |`,
  );

  const topology_markdown = [
    `# Topología Arquitectónica del Proyecto - ${nombre_proyecto} (${codigo_proyecto})`,
    `Framework: ${framework} | Origen de análisis: ${source_mode === 'zip' ? 'Paquete .zip real' : 'Metadatos SVM registrados'}`,
    `## Métricas del Grafo`,
    `- Nodos totales: ${metrics.total_nodes}\n- Relaciones detectadas: ${metrics.total_edges}\n- Rutas web: ${metrics.routes_count}\n- Vistas Blade: ${metrics.views_count}\n- Layouts/Parciales/Componentes: ${metrics.partials_layouts_count}\n- Formularios y Endpoints: ${metrics.endpoints_count}`,
    `## Mapa de Relaciones (Ruta -> Vista -> Parciales -> Endpoints)`,
    flowLines.length > 0
      ? flowLines.join('\n')
      : '- Sin relaciones explícitas detectadas.',
    `## Inventario de Vistas Blade`,
    viewRows.length > 0
      ? `| Archivo | Ruta Web | Clasificación SVM | Elementos |\n| :--- | :--- | :--- | :--- |\n${viewRows.join('\n')}`
      : 'Sin vistas registradas.',
    `## Resumen de Postura de Seguridad`,
    `- Postura estática: ${securitySummary.posture.toUpperCase()} (${securitySummary.total_findings} hallazgos, ${securitySummary.forms_with_csrf}/${securitySummary.forms_total} formularios con \`@csrf\`).`,
  ].join('\n\n');

  const project_map_json = JSON.stringify(
    {
      schema: 'docuflow-project-map/v1',
      project: {
        codigo_proyecto,
        nombre_proyecto,
        framework,
        source_mode,
      },
      metrics,
      nodes,
      edges,
      security_summary: securitySummary,
    },
    null,
    2,
  );

  const routeNodes = nodes.filter((n) => n.type === 'route');
  const layoutNodes = nodes.filter((n) =>
    ['layout', 'partial', 'component'].includes(n.type),
  );
  const endpointNodes = nodes.filter((n) => n.type === 'endpoint');

  const llms_txt = [
    `# ${nombre_proyecto} (${codigo_proyecto})`,
    `> Technical context generated by DocuFlow AI for coding agents. Stack: ${framework} (.blade.php).`,
    `## Routes and Blade Views`,
    ...(routeNodes.length > 0
      ? routeNodes.map((r) => `- ${r.label}`)
      : views.map((v) => `- ${v.ruta_web} -> ${v.archivo_blade}`)),
    `## Layouts, Partials and Components`,
    ...(layoutNodes.length > 0
      ? layoutNodes.map((l) => `- ${l.type}: ${l.file_path ?? l.label}`)
      : ['- None detected']),
    `## Forms and Endpoints`,
    ...(endpointNodes.length > 0
      ? endpointNodes.map(
          (e) =>
            `- ${e.label}${e.csrf_protected !== undefined ? ` [csrf=${e.csrf_protected}]` : ''}`,
        )
      : ['- None detected']),
    `## Generated Documentation Artifacts`,
    ...(documents.length > 0
      ? documents.map(
          (d) => `- ${d.tipo_documento} (${d.estado_auditoria}, ${d.modelo_ia})`,
        )
      : ['- No documents generated yet']),
    `## Security Summary`,
    `- Static posture: ${securitySummary.posture.toUpperCase()} | Findings: ${securitySummary.total_findings} | Forms with @csrf: ${securitySummary.forms_with_csrf}/${securitySummary.forms_total}`,
  ].join('\n');

  return { topology_markdown, project_map_json, llms_txt };
}

export async function buildAndPersistTopologyFromViews(params: {
  codigo_proyecto: string;
  nombre_proyecto: string;
  framework: string;
  source_mode: TopologySourceMode;
  views: BladeSourceEntry[];
  documents?: GeneratedDocumentRecord[];
}): Promise<ProjectTopologyRecord> {
  const { nodes, edges, metrics } = extractTopologyGraph(params.views);
  const security_report = scanBladeViewsSecurity({
    codigo_proyecto: params.codigo_proyecto,
    nombre_proyecto: params.nombre_proyecto,
    framework: params.framework,
    views: params.views,
    source_mode: params.source_mode,
  });

  const documents =
    params.documents ??
    (await documentRepository.findByProjectCode(params.codigo_proyecto));

  const artifacts = buildAiArtifacts({
    codigo_proyecto: params.codigo_proyecto,
    nombre_proyecto: params.nombre_proyecto,
    framework: params.framework,
    source_mode: params.source_mode,
    nodes,
    edges,
    metrics,
    views: params.views,
    documents,
    securitySummary: {
      posture: security_report.summary.posture,
      total_findings: security_report.summary.total_findings,
      forms_total: security_report.summary.forms_total,
      forms_with_csrf: security_report.summary.forms_with_csrf,
    },
  });

  return topologyRepository.upsertByProjectCode({
    codigo_proyecto: params.codigo_proyecto,
    nombre_proyecto: params.nombre_proyecto,
    framework: params.framework,
    source_mode: params.source_mode,
    nodes,
    edges,
    metrics,
    topology_markdown: artifacts.topology_markdown,
    project_map_json: artifacts.project_map_json,
    llms_txt: artifacts.llms_txt,
    security_report,
  });
}

export async function ensureProjectTopology(
  project: ProjectRecord,
): Promise<ProjectTopologyRecord> {
  const existing = await topologyRepository.findByProjectCode(
    project.codigo_proyecto,
  );
  if (existing) {
    return existing;
  }

  let sourceMode: TopologySourceMode = 'components_fallback';
  let views: BladeSourceEntry[] = [];

  try {
    const zipBuffer = await fs.readFile(project.archivo_zip);
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    assertNoZipSlip(entries);
    const bladeEntries = entries.filter(isRelevantBladeEntry);

    views = bladeEntries.map((entry) => {
      const normalizedPath = normalizeZipPath(entry.entryName);
      const content = entry.getData().toString('utf8');
      const analyzed = analyzeBladeContent(normalizedPath, content);
      return {
        archivo_blade: analyzed.archivo_blade,
        ruta_web: analyzed.ruta_web,
        content,
        etiqueta_svm: analyzed.etiqueta_svm,
        elementos_detectados: analyzed.elementos_detectados,
        clasificacion: analyzed.clasificacion,
      };
    });
    sourceMode = 'zip';
  } catch {
    const components = await componentRepository.findByProjectCode(
      project.codigo_proyecto,
    );
    views = components.map((comp) => ({
      archivo_blade: comp.archivo_blade,
      ruta_web: comp.ruta_web,
      content: '',
      etiqueta_svm: comp.etiqueta_svm,
      elementos_detectados: comp.elementos_detectados,
      clasificacion: comp.clasificacion,
    }));
    sourceMode = 'components_fallback';
  }

  return buildAndPersistTopologyFromViews({
    codigo_proyecto: project.codigo_proyecto,
    nombre_proyecto: project.nombre_proyecto,
    framework: project.framework,
    source_mode: sourceMode,
    views,
  });
}
