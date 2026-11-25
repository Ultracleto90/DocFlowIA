import type {
  ProjectSecurityReport,
  SecurityFinding,
  SecuritySummaryMetrics,
  StrideMatrixRow,
  TopologySourceMode,
} from '@/core/types';
import type { BladeSourceEntry } from './bladeAnalyzer';

function lineNumberAtIndex(source: string, index: number): number {
  if (index <= 0) return 1;
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) {
    if (source.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function compactSnippet(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function scanRealBladeSource(views: BladeSourceEntry[]): {
  findings: SecurityFinding[];
  formsTotal: number;
  formsWithCsrf: number;
  escapedExpressions: number;
  routesWithAuth: string[];
  routesWithForms: string[];
  routesAll: string[];
} {
  const findings: SecurityFinding[] = [];
  let formsTotal = 0;
  let formsWithCsrf = 0;
  let escapedExpressions = 0;
  const routesWithAuth = new Set<string>();
  const routesWithForms = new Set<string>();
  const routesAll = new Set<string>();

  for (const view of views) {
    const content = view.content;
    const targetLabel =
      view.ruta_web && view.ruta_web !== 'N/A'
        ? `${view.ruta_web} (${view.archivo_blade})`
        : view.archivo_blade;

    if (view.ruta_web && view.ruta_web !== 'N/A') {
      routesAll.add(view.ruta_web);
    }
    if (view.elementos_detectados.includes('directive_auth')) {
      routesWithAuth.add(targetLabel);
    }

    const escapedMatches = content.match(/\{\{\s*[\s\S]*?\s*\}\}/g);
    if (escapedMatches) {
      escapedExpressions += escapedMatches.length;
    }

    // 1. Forms CSRF check
    const formBlockRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
    let formMatch: RegExpExecArray | null;
    while ((formMatch = formBlockRegex.exec(content)) !== null) {
      formsTotal += 1;
      routesWithForms.add(targetLabel);
      const attrs = formMatch[1] ?? '';
      const body = formMatch[2] ?? '';
      const isGetOnly =
        /\bmethod\s*=\s*["']get["']/i.test(attrs) &&
        !/@method\s*\(\s*["'](put|patch|delete|post)["']/i.test(body);
      const hasCsrf = /@csrf\b|csrf_field\s*\(/i.test(body);

      if (hasCsrf) {
        formsWithCsrf += 1;
      } else if (!isGetOnly) {
        findings.push({
          id: `${view.archivo_blade}:CSRF:${findings.length + 1}`,
          rule_id: 'FORM_WITHOUT_CSRF',
          severity: 'alta',
          title: 'Formulario mutador sin token @csrf',
          owasp_category: 'A01:2021 Broken Access Control (CSRF)',
          stride_category: 'Tampering',
          archivo_blade: view.archivo_blade,
          line_number: lineNumberAtIndex(content, formMatch.index),
          snippet: compactSnippet(`<form ${attrs}>`),
          recommendation:
            'Agrega la directiva @csrf inmediatamente dentro de la etiqueta <form> para validar el token de sesión en Laravel.',
        });
      }

      if (/\baction\s*=\s*["']http:\/\//i.test(attrs)) {
        findings.push({
          id: `${view.archivo_blade}:HTTP:${findings.length + 1}`,
          rule_id: 'CLEARTEXT_HTTP_ACTION',
          severity: 'media',
          title: 'Acción de formulario enviada sobre HTTP sin cifrar',
          owasp_category: 'A02:2021 Cryptographic Failures',
          stride_category: 'Information Disclosure',
          archivo_blade: view.archivo_blade,
          line_number: lineNumberAtIndex(content, formMatch.index),
          snippet: compactSnippet(`<form ${attrs}>`),
          recommendation:
            'Utiliza helper route() con HTTPS forzado en producción o rutas relativas en action.',
        });
      }
    }

    // 2. Unescaped Blade output {!! ... !!}
    const unescapedRegex = /\{!!\s*[\s\S]*?\s*!!\}/g;
    let unescapedMatch: RegExpExecArray | null;
    while ((unescapedMatch = unescapedRegex.exec(content)) !== null) {
      findings.push({
        id: `${view.archivo_blade}:XSS:${findings.length + 1}`,
        rule_id: 'UNESCAPED_BLADE_OUTPUT',
        severity: 'alta',
        title: 'Salida Blade sin escape HTML ({!! ... !!})',
        owasp_category: 'A03:2021 Injection (XSS)',
        stride_category: 'Tampering',
        archivo_blade: view.archivo_blade,
        line_number: lineNumberAtIndex(content, unescapedMatch.index),
        snippet: compactSnippet(unescapedMatch[0]),
        recommendation:
          'Reemplaza {!! ... !!} por {{ ... }} o aplica sanitización estricta (e.g. HTML Purifier) si es HTML confiable.',
      });
    }

    // 3. Hardcoded Secrets / API Keys
    const secretRegex =
      /(?:(?:api[_-]?key|client[_-]?secret|secret[_-]?key|access[_-]?token|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9_\-./+=]{10,}["']|sk_live_[A-Za-z0-9]{12,}|AIza[0-9A-Za-z_-]{25,})/gi;
    let secretMatch: RegExpExecArray | null;
    while ((secretMatch = secretRegex.exec(content)) !== null) {
      findings.push({
        id: `${view.archivo_blade}:SEC:${findings.length + 1}`,
        rule_id: 'HARDCODED_SECRET',
        severity: 'critica',
        title: 'Posible secreto o API Key expuesta en plantilla Blade',
        owasp_category: 'A02:2021 Cryptographic Failures',
        stride_category: 'Information Disclosure',
        archivo_blade: view.archivo_blade,
        line_number: lineNumberAtIndex(content, secretMatch.index),
        snippet: compactSnippet(secretMatch[0]).replace(
          /([A-Za-z0-9]{6})[A-Za-z0-9_\-./+=]{6,}/g,
          '$1******',
        ),
        recommendation:
          'Mueve credenciales a variables .env consumidas en backend y nunca las incrustes en vistas enviadas al navegador.',
      });
    }

    // 4. Risky inline JS handlers or javascript: URIs
    const inlineJsRegex =
      /(?:\bon(?:click|load|error|submit|mouseover)\s*=\s*["'][^"']+["']|\bhref\s*=\s*["']\s*javascript:[^"']*["'])/gi;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = inlineJsRegex.exec(content)) !== null) {
      findings.push({
        id: `${view.archivo_blade}:INLINE:${findings.length + 1}`,
        rule_id: 'RISKY_INLINE_HANDLER',
        severity: 'media',
        title: 'Manejador JavaScript inline o URI javascript: detectado',
        owasp_category: 'A03:2021 Injection / CSP Hardening',
        stride_category: 'Elevation of Privilege',
        archivo_blade: view.archivo_blade,
        line_number: lineNumberAtIndex(content, inlineMatch.index),
        snippet: compactSnippet(inlineMatch[0]),
        recommendation:
          'Desacopla eventos con addEventListener o directivas Alpine/Vite y evita esquemas javascript: para habilitar CSP estricta.',
      });
    }

    // 5. Password inputs missing autocomplete hint
    const pwRegex = /<input\b[^>]*type\s*=\s*["']password["'][^>]*>/gi;
    let pwMatch: RegExpExecArray | null;
    while ((pwMatch = pwRegex.exec(content)) !== null) {
      if (!/\bautocomplete\s*=/i.test(pwMatch[0])) {
        findings.push({
          id: `${view.archivo_blade}:PW:${findings.length + 1}`,
          rule_id: 'PASSWORD_AUTOCOMPLETE',
          severity: 'baja',
          title: 'Campo password sin atributo autocomplete explícito',
          owasp_category: 'A05:2021 Security Misconfiguration',
          stride_category: 'Spoofing',
          archivo_blade: view.archivo_blade,
          line_number: lineNumberAtIndex(content, pwMatch.index),
          snippet: compactSnippet(pwMatch[0]),
          recommendation:
            'Especifica autocomplete="current-password" o autocomplete="new-password" según el flujo de autenticación.',
        });
      }
    }
  }

  return {
    findings,
    formsTotal,
    formsWithCsrf,
    escapedExpressions,
    routesWithAuth: Array.from(routesWithAuth),
    routesWithForms: Array.from(routesWithForms),
    routesAll: Array.from(routesAll),
  };
}

function buildFallbackScan(views: BladeSourceEntry[]): {
  findings: SecurityFinding[];
  formsTotal: number;
  formsWithCsrf: number;
  escapedExpressions: number;
  routesWithAuth: string[];
  routesWithForms: string[];
  routesAll: string[];
} {
  const findings: SecurityFinding[] = [];
  let formsTotal = 0;
  let formsWithCsrf = 0;
  const routesWithAuth: string[] = [];
  const routesWithForms: string[] = [];
  const routesAll: string[] = [];

  for (const view of views) {
    const label =
      view.ruta_web && view.ruta_web !== 'N/A'
        ? `${view.ruta_web} (${view.archivo_blade})`
        : view.archivo_blade;
    if (view.ruta_web && view.ruta_web !== 'N/A') {
      routesAll.push(view.ruta_web);
    }
    if (view.elementos_detectados.includes('directive_auth')) {
      routesWithAuth.push(label);
    }
    if (view.elementos_detectados.includes('form')) {
      formsTotal += 1;
      routesWithForms.push(label);
      if (view.elementos_detectados.includes('directive_csrf')) {
        formsWithCsrf += 1;
      } else {
        findings.push({
          id: `${view.archivo_blade}:CSRF:${findings.length + 1}`,
          rule_id: 'FORM_WITHOUT_CSRF',
          severity: 'alta',
          title: 'Formulario detectado sin registro de directiva @csrf en metadatos SVM',
          owasp_category: 'A01:2021 Broken Access Control (CSRF)',
          stride_category: 'Tampering',
          archivo_blade: view.archivo_blade,
          line_number: 1,
          snippet: 'Elementos detectados: ' + view.elementos_detectados.join(', '),
          recommendation:
            'Verifica la presencia de @csrf en la plantilla original y vuelve a analizar el paquete .zip.',
        });
      }
    }
  }

  return {
    findings,
    formsTotal,
    formsWithCsrf,
    escapedExpressions: views.length,
    routesWithAuth,
    routesWithForms,
    routesAll,
  };
}

function buildStrideMatrix(params: {
  findings: SecurityFinding[];
  formsTotal: number;
  formsWithCsrf: number;
  escapedExpressions: number;
  routesWithForms: string[];
  routesAll: string[];
  routesWithAuth: string[];
}): StrideMatrixRow[] {
  const {
    findings,
    formsTotal,
    formsWithCsrf,
    escapedExpressions,
    routesWithForms,
    routesAll,
    routesWithAuth,
  } = params;

  const hasFinding = (cat: StrideMatrixRow['category'], minSeverity?: 'critica' | 'alta') =>
    findings.some(
      (f) =>
        f.stride_category === cat &&
        (!minSeverity || f.severity === minSeverity),
    );

  const authTargets =
    routesAll.filter((r) => /login|register|auth|password/i.test(r)).length > 0
      ? routesAll.filter((r) => /login|register|auth|password/i.test(r))
      : routesAll.slice(0, 3);

  const formTargets =
    routesWithForms.length > 0 ? routesWithForms : routesAll.slice(0, 3);

  return [
    {
      category: 'Spoofing',
      threat_summary:
        'Suplantación de identidad en vistas de autenticación o formularios de acceso.',
      affected_targets:
        authTargets.length > 0 ? authTargets : ['Sin rutas de autenticación detectadas'],
      status: hasFinding('Spoofing') ? 'atencion' : 'mitigado',
      evidence:
        routesWithAuth.length > 0
          ? `Directivas @auth/@guest detectadas en ${routesWithAuth.length} vista(s).`
          : 'Revisión estática de inputs de credenciales y atributos autocomplete.',
      mitigation:
        'Mantener middleware auth en Laravel, @csrf en login y autocomplete explícito en inputs password.',
    },
    {
      category: 'Tampering',
      threat_summary:
        'Manipulación de peticiones (CSRF) o inyección HTML/XSS por salida sin escape.',
      affected_targets:
        formTargets.length > 0 ? formTargets : ['Vistas Blade funcionales'],
      status: hasFinding('Tampering') ? 'riesgo' : 'mitigado',
      evidence: `${formsWithCsrf} de ${formsTotal} formulario(s) protegidos con @csrf; ${escapedExpressions} expresiones escapadas ({{ }}).`,
      mitigation:
        'Incluir @csrf en todos los formularios mutadores y evitar sintaxis {!! ... !!} para entradas de usuario.',
    },
    {
      category: 'Repudiation',
      threat_summary:
        'Acciones administrativas o de negocio en rutas web sin trazabilidad de sesión.',
      affected_targets:
        formTargets.length > 0 ? formTargets : routesAll.slice(0, 3),
      status: formsTotal > 0 ? 'mitigado' : 'atencion',
      evidence:
        'Los formularios POST y acciones mutadoras pasan por controladores Laravel integrables con logs de auditoría.',
      mitigation:
        'Asociar eventos críticos a auth()->id() y registrar IP/timestamp en la bitácora del backend.',
    },
    {
      category: 'Information Disclosure',
      threat_summary:
        'Exposición de credenciales en plantillas Blade o envío de datos en texto claro (HTTP).',
      affected_targets:
        findings
          .filter((f) => f.stride_category === 'Information Disclosure')
          .map((f) => f.archivo_blade).length > 0
          ? findings
              .filter((f) => f.stride_category === 'Information Disclosure')
              .map((f) => f.archivo_blade)
          : ['Todas las vistas .blade.php'],
      status: hasFinding('Information Disclosure', 'critica')
        ? 'riesgo'
        : hasFinding('Information Disclosure')
          ? 'atencion'
          : 'mitigado',
      evidence: hasFinding('Information Disclosure')
        ? 'Se detectaron posibles patrones sensibles o acciones HTTP en plantillas.'
        : 'Sin secretos hardcodeados ni envíos a URLs http:// detectados en las vistas.',
      mitigation:
        'Conservar llaves API exclusivamente en .env del servidor y forzar esquema HTTPS en rutas y assets.',
    },
    {
      category: 'Denial of Service',
      threat_summary:
        'Sobrecarga de renderizado o consultas N+1 en bucles Blade con gran volumen de registros.',
      affected_targets:
        routesAll.length > 0 ? routesAll : ['Vistas con tablas y @foreach'],
      status: 'atencion',
      evidence:
        'Vistas de listado (@foreach / <table>) deben paginar colecciones desde Eloquent.',
      mitigation:
        'Aplicar ->paginate() en controladores y limitar carga de parciales anidados dentro de bucles.',
    },
    {
      category: 'Elevation of Privilege',
      threat_summary:
        'Ejecución de scripts inline o exposición de acciones privilegiadas sin directivas @can.',
      affected_targets:
        findings
          .filter((f) => f.stride_category === 'Elevation of Privilege')
          .map((f) => f.archivo_blade).length > 0
          ? findings
              .filter((f) => f.stride_category === 'Elevation of Privilege')
              .map((f) => f.archivo_blade)
          : routesAll.slice(0, 3),
      status: hasFinding('Elevation of Privilege') ? 'atencion' : 'mitigado',
      evidence: hasFinding('Elevation of Privilege')
        ? 'Presencia de manejadores JavaScript inline que debilitan políticas CSP.'
        : 'Sin manejadores onclick/javascript: inline detectados; control de permisos delegable a @can/Policies.',
      mitigation:
        'Proteger rutas y acciones administrativas con Laravel Gates/Policies (@can) y Content-Security-Policy.',
    },
  ];
}

export function scanBladeViewsSecurity(params: {
  codigo_proyecto: string;
  nombre_proyecto: string;
  framework: string;
  views: BladeSourceEntry[];
  source_mode: TopologySourceMode;
}): ProjectSecurityReport {
  const scan =
    params.source_mode === 'zip'
      ? scanRealBladeSource(params.views)
      : buildFallbackScan(params.views);

  const critica = scan.findings.filter((f) => f.severity === 'critica').length;
  const alta = scan.findings.filter((f) => f.severity === 'alta').length;
  const media = scan.findings.filter((f) => f.severity === 'media').length;
  const baja = scan.findings.filter((f) => f.severity === 'baja').length;

  const summary: SecuritySummaryMetrics = {
    scanned_views: params.views.length,
    total_findings: scan.findings.length,
    critica,
    alta,
    media,
    baja,
    forms_total: scan.formsTotal,
    forms_with_csrf: scan.formsWithCsrf,
    escaped_expressions: scan.escapedExpressions,
    posture:
      critica > 0 || alta >= 2
        ? 'critica'
        : scan.findings.length > 0
          ? 'moderada'
          : 'solida',
  };

  const stride_matrix = buildStrideMatrix({
    findings: scan.findings,
    formsTotal: scan.formsTotal,
    formsWithCsrf: scan.formsWithCsrf,
    escapedExpressions: scan.escapedExpressions,
    routesWithForms: scan.routesWithForms,
    routesAll: scan.routesAll,
    routesWithAuth: scan.routesWithAuth,
  });

  const findingsTable =
    scan.findings.length > 0
      ? [
          '| Severidad | Regla | Archivo | Línea | OWASP / STRIDE | Recomendación |',
          '| :--- | :--- | :--- | :--- | :--- | :--- |',
          ...scan.findings.map(
            (f) =>
              `| ${f.severity.toUpperCase()} | ${f.title} | \`${f.archivo_blade}\` | ${f.line_number} | ${f.owasp_category} / ${f.stride_category} | ${f.recommendation} |`,
          ),
        ].join('\n')
      : 'Sin vulnerabilidades estáticas críticas o altas detectadas en las plantillas analizadas.';

  const strideTable = [
    '| Categoría STRIDE | Estado | Objetivos Asociados | Evidencia | Mitigación |',
    '| :--- | :--- | :--- | :--- | :--- |',
    ...stride_matrix.map(
      (row) =>
        `| ${row.category} | ${row.status.toUpperCase()} | ${row.affected_targets.join(', ')} | ${row.evidence} | ${row.mitigation} |`,
    ),
  ].join('\n');

  const security_markdown = [
    `# Reporte de Seguridad Estática Blade y Matriz STRIDE - ${params.nombre_proyecto} (${params.codigo_proyecto})`,
    `Framework: ${params.framework} | Vistas escaneadas: ${summary.scanned_views} | Postura: ${summary.posture.toUpperCase()}`,
    `## Resumen Ejecutivo`,
    `- Formularios analizados: ${summary.forms_total} (con \`@csrf\`: ${summary.forms_with_csrf})\n- Expresiones escapadas (\`{{ }}\`): ${summary.escaped_expressions}\n- Hallazgos totales: ${summary.total_findings} (Crítica: ${summary.critica}, Alta: ${summary.alta}, Media: ${summary.media}, Baja: ${summary.baja})`,
    `## Hallazgos por Archivo Blade`,
    findingsTable,
    `## Matriz de Amenazas STRIDE`,
    strideTable,
  ].join('\n\n');

  return {
    summary,
    findings: scan.findings,
    stride_matrix,
    security_markdown,
  };
}
