import { Schema, type Connection, type Model, type Types } from 'mongoose';
import {
  AUDIT_STATES,
  DOCUMENT_TYPES,
  type DocumentAuditState,
  type DocumentType,
} from '@/core/constants/plans';

export interface DocumentoGeneradoDoc {
  _id: Types.ObjectId;
  codigo_proyecto: string;
  tipo_documento: DocumentType;
  estado_auditoria: DocumentAuditState;
  token_count: number;
  modelo_ia: string;
  contenido_markdown: string;
}

export const DocumentoGeneradoSchema = new Schema<DocumentoGeneradoDoc>(
  {
    codigo_proyecto: { type: String, required: true, index: true },
    tipo_documento: { type: String, enum: DOCUMENT_TYPES, required: true },
    estado_auditoria: {
      type: String,
      enum: AUDIT_STATES,
      default: 'borrador_ia',
    },
    token_count: { type: Number, required: true },
    modelo_ia: { type: String, required: true },
    contenido_markdown: { type: String, required: true },
  },
  {
    collection: 'documentos_generados',
    versionKey: false,
  },
);

export function getDocumentoGeneradoModel(
  conn: Connection,
): Model<DocumentoGeneradoDoc> {
  return (
    (conn.models.DocumentoGenerado as Model<DocumentoGeneradoDoc> | undefined) ??
    conn.model<DocumentoGeneradoDoc>(
      'DocumentoGenerado',
      DocumentoGeneradoSchema,
    )
  );
}
