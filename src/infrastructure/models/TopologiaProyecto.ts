import { Schema, type Connection, type Model, type Types } from 'mongoose';
import {
  SECURITY_SEVERITIES,
  STRIDE_CATEGORIES,
  STRIDE_STATUSES,
  TOPOLOGY_EDGE_RELATIONS,
  TOPOLOGY_NODE_TYPES,
  type ProjectSecurityReport,
  type SecurityFinding,
  type SecuritySeverity,
  type StrideCategory,
  type StrideMatrixRow,
  type StrideStatus,
  type TopologyEdge,
  type TopologyEdgeRelation,
  type TopologyMetrics,
  type TopologyNode,
  type TopologyNodeType,
  type TopologySourceMode,
} from '@/core/types';

export interface TopologiaProyectoDoc {
  _id: Types.ObjectId;
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
  updated_at: Date;
}

const TopologyNodeSubSchema = new Schema<TopologyNode>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: TOPOLOGY_NODE_TYPES,
      required: true,
    },
    label: { type: String, required: true },
    file_path: { type: String },
    route_path: { type: String },
    http_method: { type: String },
    svm_classification: {
      type: String,
      enum: ['Código Relevante', 'Ruido Visual'],
    },
    elements: { type: [String], default: undefined },
    csrf_protected: { type: Boolean },
  },
  { _id: false },
);

const TopologyEdgeSubSchema = new Schema<TopologyEdge>(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    relation: {
      type: String,
      enum: TOPOLOGY_EDGE_RELATIONS,
      required: true,
    },
    label: { type: String, required: true },
  },
  { _id: false },
);

const TopologyMetricsSubSchema = new Schema<TopologyMetrics>(
  {
    total_nodes: { type: Number, required: true },
    total_edges: { type: Number, required: true },
    routes_count: { type: Number, required: true },
    views_count: { type: Number, required: true },
    partials_layouts_count: { type: Number, required: true },
    endpoints_count: { type: Number, required: true },
  },
  { _id: false },
);

const SecurityFindingSubSchema = new Schema<SecurityFinding>(
  {
    id: { type: String, required: true },
    rule_id: { type: String, required: true },
    severity: {
      type: String,
      enum: SECURITY_SEVERITIES as readonly SecuritySeverity[],
      required: true,
    },
    title: { type: String, required: true },
    owasp_category: { type: String, required: true },
    stride_category: {
      type: String,
      enum: STRIDE_CATEGORIES as readonly StrideCategory[],
      required: true,
    },
    archivo_blade: { type: String, required: true },
    line_number: { type: Number, required: true },
    snippet: { type: String, required: true },
    recommendation: { type: String, required: true },
  },
  { _id: false },
);

const StrideMatrixRowSubSchema = new Schema<StrideMatrixRow>(
  {
    category: {
      type: String,
      enum: STRIDE_CATEGORIES as readonly StrideCategory[],
      required: true,
    },
    threat_summary: { type: String, required: true },
    affected_targets: { type: [String], default: [] },
    status: {
      type: String,
      enum: STRIDE_STATUSES as readonly StrideStatus[],
      required: true,
    },
    evidence: { type: String, required: true },
    mitigation: { type: String, required: true },
  },
  { _id: false },
);

const SecurityReportSubSchema = new Schema<ProjectSecurityReport>(
  {
    summary: {
      scanned_views: { type: Number, required: true },
      total_findings: { type: Number, required: true },
      critica: { type: Number, required: true },
      alta: { type: Number, required: true },
      media: { type: Number, required: true },
      baja: { type: Number, required: true },
      forms_total: { type: Number, required: true },
      forms_with_csrf: { type: Number, required: true },
      escaped_expressions: { type: Number, required: true },
      posture: {
        type: String,
        enum: ['solida', 'moderada', 'critica'],
        required: true,
      },
    },
    findings: { type: [SecurityFindingSubSchema], default: [] },
    stride_matrix: { type: [StrideMatrixRowSubSchema], default: [] },
    security_markdown: { type: String, required: true },
  },
  { _id: false },
);

export const TopologiaProyectoSchema = new Schema<TopologiaProyectoDoc>(
  {
    codigo_proyecto: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    nombre_proyecto: { type: String, required: true, trim: true },
    framework: { type: String, required: true, trim: true },
    source_mode: {
      type: String,
      enum: ['zip', 'components_fallback'],
      default: 'zip',
      required: true,
    },
    nodes: { type: [TopologyNodeSubSchema], default: [] },
    edges: { type: [TopologyEdgeSubSchema], default: [] },
    metrics: { type: TopologyMetricsSubSchema, required: true },
    topology_markdown: { type: String, required: true },
    project_map_json: { type: String, required: true },
    llms_txt: { type: String, required: true },
    security_report: { type: SecurityReportSubSchema, required: true },
    updated_at: { type: Date, default: Date.now },
  },
  {
    collection: 'topologias_proyecto',
    versionKey: false,
  },
);

export type { TopologyNodeType, TopologyEdgeRelation };

export function getTopologiaProyectoModel(
  conn: Connection,
): Model<TopologiaProyectoDoc> {
  return (
    (conn.models.TopologiaProyecto as Model<TopologiaProyectoDoc> | undefined) ??
    conn.model<TopologiaProyectoDoc>('TopologiaProyecto', TopologiaProyectoSchema)
  );
}
