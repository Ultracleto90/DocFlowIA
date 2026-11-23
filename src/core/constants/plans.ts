export const PLAN_NAMES = ['Freemium', 'Pro', 'Team IA', 'Enterprise'] as const;
export type PlanName = (typeof PLAN_NAMES)[number];

export const USER_ROLES = [
  'Administrador',
  'Project Manager',
  'Desarrollador',
  'Editor',
  'Revisor QA',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOCUMENT_TYPES = [
  'Historias de Usuario (INVEST)',
  'Manual Técnico (IEEE 830)',
  'Manual de Usuario (ISO 26514)',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const PROCESSING_STATES = [
  'pendiente',
  'filtrando_svm',
  'redactando_ia',
  'completado',
] as const;
export type ProcessingState = (typeof PROCESSING_STATES)[number];

export const AUDIT_STATES = ['borrador_ia', 'validado_humano'] as const;
export type DocumentAuditState = (typeof AUDIT_STATES)[number];

export const AUDIT_RESULTS = ['EXITOSO', 'BLOQUEADO_UNAUTHORIZED'] as const;
export type AuditResult = (typeof AUDIT_RESULTS)[number];

export const SVM_CLASSIFICATIONS = ['Código Relevante', 'Ruido Visual'] as const;
export type SvmClassification = (typeof SVM_CLASSIFICATIONS)[number];

export type ExportFormat = 'md' | 'pdf';

export interface PlanFeatures {
  blade_wcag_audit: boolean;
  owasp_audit: boolean;
  cmmi_iso9001_templates: boolean;
  uml_use_cases: boolean;
  uml_sequence_er: boolean;
  webhooks: boolean;
  white_label: boolean;
  api_key: boolean;
  audit_log_access: boolean;
}

export interface PlanDefinition {
  nombre: PlanName;
  subtitulo: string;
  precio: number;
  moneda: 'MXN';
  max_proyectos_mes: number;
  max_zip_mb: number;
  max_vistas_blade: number;
  nivel_ia: 'L1' | 'L2' | 'L3' | 'L4';
  modelo_ia: string;
  tiene_anuncios: boolean;
  intersticial_segundos: number;
  marca_agua_md: boolean;
  entregables: readonly DocumentType[];
  formatos_exportacion: readonly ExportFormat[];
  pdf_habilitado: boolean;
  almacenamiento_gb: number;
  retencion_dias: number | null;
  max_miembros_equipo: number | null;
  extras_resumen: string;
  features: PlanFeatures;
}

export const PLANS_CATALOG: Record<PlanName, PlanDefinition> = {
  Freemium: {
    nombre: 'Freemium',
    subtitulo: 'Explorer Ad-Supported',
    precio: 0,
    moneda: 'MXN',
    max_proyectos_mes: 2,
    max_zip_mb: 15,
    max_vistas_blade: 15,
    nivel_ia: 'L1',
    modelo_ia: 'Phi-3 Mini 3.8B Q4',
    tiene_anuncios: true,
    intersticial_segundos: 15,
    marca_agua_md: true,
    entregables: ['Historias de Usuario (INVEST)'],
    formatos_exportacion: ['md'],
    pdf_habilitado: false,
    almacenamiento_gb: 2,
    retencion_dias: 15,
    max_miembros_equipo: 1,
    extras_resumen: '2 GB / 15 días retención, 1 usuario',
    features: {
      blade_wcag_audit: false,
      owasp_audit: false,
      cmmi_iso9001_templates: false,
      uml_use_cases: false,
      uml_sequence_er: false,
      webhooks: false,
      white_label: false,
      api_key: false,
      audit_log_access: false,
    },
  },
  Pro: {
    nombre: 'Pro',
    subtitulo: 'Indie & Freelance',
    precio: 399,
    moneda: 'MXN',
    max_proyectos_mes: 10,
    max_zip_mb: 150,
    max_vistas_blade: 100,
    nivel_ia: 'L2',
    modelo_ia: 'Phi-3 Mini FP16 + Qwen 2.5 Coder 7B',
    tiene_anuncios: false,
    intersticial_segundos: 0,
    marca_agua_md: false,
    entregables: [
      'Historias de Usuario (INVEST)',
      'Manual Técnico (IEEE 830)',
      'Manual de Usuario (ISO 26514)',
    ],
    formatos_exportacion: ['md', 'pdf'],
    pdf_habilitado: true,
    almacenamiento_gb: 100,
    retencion_dias: null,
    max_miembros_equipo: 2,
    extras_resumen: '100 GB, 1 titular + 1 invitado lectura, UML Casos de Uso',
    features: {
      blade_wcag_audit: false,
      owasp_audit: false,
      cmmi_iso9001_templates: false,
      uml_use_cases: true,
      uml_sequence_er: false,
      webhooks: false,
      white_label: false,
      api_key: false,
      audit_log_access: false,
    },
  },
  'Team IA': {
    nombre: 'Team IA',
    subtitulo: 'Agencias & Startups',
    precio: 999,
    moneda: 'MXN',
    max_proyectos_mes: 30,
    max_zip_mb: 500,
    max_vistas_blade: 300,
    nivel_ia: 'L3',
    modelo_ia: 'Qwen 2.5 Coder 14B/32B + Llama 3.1',
    tiene_anuncios: false,
    intersticial_segundos: 0,
    marca_agua_md: false,
    entregables: [
      'Historias de Usuario (INVEST)',
      'Manual Técnico (IEEE 830)',
      'Manual de Usuario (ISO 26514)',
    ],
    formatos_exportacion: ['md', 'pdf'],
    pdf_habilitado: true,
    almacenamiento_gb: 1024,
    retencion_dias: null,
    max_miembros_equipo: 5,
    extras_resumen: '1 TB, hasta 5 usuarios RBAC, Webhooks GitHub/GitLab, Secuencia/ER',
    features: {
      blade_wcag_audit: true,
      owasp_audit: false,
      cmmi_iso9001_templates: false,
      uml_use_cases: true,
      uml_sequence_er: true,
      webhooks: true,
      white_label: false,
      api_key: false,
      audit_log_access: false,
    },
  },
  Enterprise: {
    nombre: 'Enterprise',
    subtitulo: 'Enterprise & Custom Cloud',
    precio: 3999,
    moneda: 'MXN',
    max_proyectos_mes: 9999,
    max_zip_mb: 2048,
    max_vistas_blade: 2000,
    nivel_ia: 'L4',
    modelo_ia: '70B / Gemini API + RAG',
    tiene_anuncios: false,
    intersticial_segundos: 0,
    marca_agua_md: false,
    entregables: [
      'Historias de Usuario (INVEST)',
      'Manual Técnico (IEEE 830)',
      'Manual de Usuario (ISO 26514)',
    ],
    formatos_exportacion: ['md', 'pdf'],
    pdf_habilitado: true,
    almacenamiento_gb: 5120,
    retencion_dias: null,
    max_miembros_equipo: null,
    extras_resumen: '5 TB, usuarios ilimitados, Bitácora completa, API REST Key, White-Label',
    features: {
      blade_wcag_audit: true,
      owasp_audit: true,
      cmmi_iso9001_templates: true,
      uml_use_cases: true,
      uml_sequence_er: true,
      webhooks: true,
      white_label: true,
      api_key: true,
      audit_log_access: true,
    },
  },
};

export const PLANS_LIST: readonly PlanDefinition[] = PLAN_NAMES.map(
  (name) => PLANS_CATALOG[name],
);

export function getPlanDefinition(planName: PlanName): PlanDefinition {
  return PLANS_CATALOG[planName];
}

export function toEmbeddedPlan(planName: PlanName): {
  nombre: PlanName;
  precio: number;
  max_proyectos_mes: number;
} {
  const def = PLANS_CATALOG[planName];
  return {
    nombre: def.nombre,
    precio: def.precio,
    max_proyectos_mes: def.max_proyectos_mes,
  };
}
