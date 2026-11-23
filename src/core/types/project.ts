import type {
  DocumentAuditState,
  DocumentType,
  ProcessingState,
  SvmClassification,
} from '@/core/constants/plans';

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
