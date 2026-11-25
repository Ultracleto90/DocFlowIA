import type {
  DocumentAuditState,
  DocumentType,
  ProcessingState,
  SvmClassification,
} from '@/core/constants/plans';
import type { PlanUsageSummary } from './user';

export const FOLDER_ACCESS_ROLES = [
  'lectura',
  'edicion',
  'validador',
] as const;
export type FolderAccessRole = (typeof FOLDER_ACCESS_ROLES)[number];

export interface ProjectAccessPermission {
  email: string;
  rol_carpeta: FolderAccessRole;
  assigned_at: string;
}

export interface ProjectRecord {
  id: string;
  codigo_proyecto: string;
  nombre_proyecto: string;
  usuario_correo: string;
  archivo_zip: string;
  framework: string;
  estado_procesamiento: ProcessingState;
  created_at?: string;
  webhook_url?: string;
  permisos_acceso?: ProjectAccessPermission[];
}

export interface FilteredComponentRecord {
  id: string;
  codigo_proyecto: string;
  archivo_blade: string;
  ruta_web: string;
  elementos_detectados: string[];
  etiqueta_svm: 0 | 1;
  clasificacion: SvmClassification;
}

export interface GeneratedDocumentRecord {
  id: string;
  codigo_proyecto: string;
  tipo_documento: DocumentType;
  estado_auditoria: DocumentAuditState;
  token_count: number;
  modelo_ia: string;
  contenido_markdown: string;
}

export interface ProjectIngestionSummary {
  total_blade_views: number;
  relevant_views: number;
  noise_views: number;
  documents_generated: number;
}

export interface ProjectListResponseDTO {
  projects: ProjectRecord[];
  usage: PlanUsageSummary;
}

export interface ProjectDetailResponseDTO {
  project: ProjectRecord;
  components: FilteredComponentRecord[];
  documents: GeneratedDocumentRecord[];
}

export interface CreateProjectResponseDTO {
  project: ProjectRecord;
  components: FilteredComponentRecord[];
  documents: GeneratedDocumentRecord[];
  summary: ProjectIngestionSummary;
}

export interface DeleteProjectResponseDTO {
  message: string;
  codigo_proyecto: string;
}

export interface SaveWebhookRequestDTO {
  webhook_url: string;
}

export interface SaveWebhookResponseDTO {
  project: ProjectRecord;
}

export interface UpdateDocumentRequestDTO {
  contenido_markdown?: string;
  estado_auditoria?: DocumentAuditState;
}

export interface UpdateDocumentResponseDTO {
  document: GeneratedDocumentRecord;
}

export interface UpdateProjectAccessRequestDTO {
  permisos_acceso: Array<{
    email: string;
    rol_carpeta: FolderAccessRole;
  }>;
}

export interface UpdateProjectAccessResponseDTO {
  project: ProjectRecord;
  message: string;
}
