import type { PlanName } from '@/core/constants/plans';
import type { ProjectRecord } from './project';

export const TOPOLOGY_NODE_TYPES = [
  'route',
  'view',
  'layout',
  'partial',
  'component',
  'endpoint',
] as const;
export type TopologyNodeType = (typeof TOPOLOGY_NODE_TYPES)[number];

export const TOPOLOGY_EDGE_RELATIONS = [
  'renders',
  'extends',
  'includes',
  'uses_component',
  'submits_to',
  'links_to',
] as const;
export type TopologyEdgeRelation = (typeof TOPOLOGY_EDGE_RELATIONS)[number];

export interface TopologyNode {
  id: string;
  type: TopologyNodeType;
  label: string;
  file_path?: string;
  route_path?: string;
  http_method?: string;
  svm_classification?: 'Código Relevante' | 'Ruido Visual';
  elements?: string[];
  csrf_protected?: boolean;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  relation: TopologyEdgeRelation;
  label: string;
}

export interface TopologyMetrics {
  total_nodes: number;
  total_edges: number;
  routes_count: number;
  views_count: number;
  partials_layouts_count: number;
  endpoints_count: number;
}

export const SECURITY_SEVERITIES = ['critica', 'alta', 'media', 'baja'] as const;
export type SecuritySeverity = (typeof SECURITY_SEVERITIES)[number];

export const STRIDE_CATEGORIES = [
  'Spoofing',
  'Tampering',
  'Repudiation',
  'Information Disclosure',
  'Denial of Service',
  'Elevation of Privilege',
] as const;
export type StrideCategory = (typeof STRIDE_CATEGORIES)[number];

export const STRIDE_STATUSES = ['mitigado', 'atencion', 'riesgo'] as const;
export type StrideStatus = (typeof STRIDE_STATUSES)[number];

export type SecurityRuleId =
  | 'FORM_WITHOUT_CSRF'
  | 'UNESCAPED_BLADE_OUTPUT'
  | 'HARDCODED_SECRET'
  | 'RISKY_INLINE_HANDLER'
  | 'CLEARTEXT_HTTP_ACTION'
  | 'PASSWORD_AUTOCOMPLETE';

export interface SecurityFinding {
  id: string;
  rule_id: SecurityRuleId;
  severity: SecuritySeverity;
  title: string;
  owasp_category: string;
  stride_category: StrideCategory;
  archivo_blade: string;
  line_number: number;
  snippet: string;
  recommendation: string;
}

export interface StrideMatrixRow {
  category: StrideCategory;
  threat_summary: string;
  affected_targets: string[];
  status: StrideStatus;
  evidence: string;
  mitigation: string;
}

export interface SecuritySummaryMetrics {
  scanned_views: number;
  total_findings: number;
  critica: number;
  alta: number;
  media: number;
  baja: number;
  forms_total: number;
  forms_with_csrf: number;
  escaped_expressions: number;
  posture: 'solida' | 'moderada' | 'critica';
}

export interface ProjectSecurityReport {
  summary: SecuritySummaryMetrics;
  findings: SecurityFinding[];
  stride_matrix: StrideMatrixRow[];
  security_markdown: string;
}

export type TopologySourceMode = 'zip' | 'components_fallback';

export interface ProjectTopologyRecord {
  id: string;
  codigo_proyecto: string;
  nombre_proyecto: string;
  framework: string;
  source_mode: TopologySourceMode;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  metrics: TopologyMetrics;
  topology_markdown: string;
  project_map_json: string;
  llms_txt: string;
  security_report: ProjectSecurityReport;
  updated_at: string;
}

export interface ProjectTopologyResponseDTO {
  topology: ProjectTopologyRecord;
}

export interface ProjectSecurityResponseDTO {
  codigo_proyecto: string;
  nombre_proyecto: string;
  plan_actual: PlanName;
  unlocked: boolean;
  report: ProjectSecurityReport;
  updated_at: string;
}

export type ProjectFileCategory =
  | 'zip_original'
  | 'kit_bundle'
  | 'manual'
  | 'topologia_ia'
  | 'seguridad';

export type BundleArtifactKey =
  | 'kit'
  | 'source_zip'
  | 'topology_md'
  | 'project_map_json'
  | 'llms_txt'
  | 'security_md';

export interface ProjectVirtualFileItem {
  id: string;
  filename: string;
  label: string;
  category: ProjectFileCategory;
  extension: 'zip' | 'md' | 'json' | 'txt';
  size_bytes: number;
  available: boolean;
  status_label: string;
  document_id?: string;
  artifact_key?: BundleArtifactKey;
}

export interface ProjectFolderSummary {
  project: ProjectRecord;
  source_zip_exists: boolean;
  total_files: number;
  files: ProjectVirtualFileItem[];
}

export interface FilesExplorerResponseDTO {
  folders: ProjectFolderSummary[];
  total_projects: number;
  total_artifacts: number;
}
