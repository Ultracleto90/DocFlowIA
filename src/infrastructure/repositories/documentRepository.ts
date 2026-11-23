import type { DocumentAuditState, DocumentType } from '@/core/constants/plans';
import type { GeneratedDocumentRecord } from '@/core/types';
import {
  getDocumentoGeneradoModel,
  type DocumentoGeneradoDoc,
} from '@/infrastructure/models/DocumentoGenerado';
import { getReadOnlyConnection, getWriteConnection } from '@/lib/db/mongodb';

function toDocumentRecord(doc: DocumentoGeneradoDoc): GeneratedDocumentRecord {
  return {
    id: doc._id.toString(),
    codigo_proyecto: doc.codigo_proyecto,
    tipo_documento: doc.tipo_documento,
    estado_auditoria: doc.estado_auditoria,
    token_count: doc.token_count,
    modelo_ia: doc.modelo_ia,
    contenido_markdown: doc.contenido_markdown,
  };
}

export interface CreateDocumentInput {
  codigo_proyecto: string;
  tipo_documento: DocumentType;
  estado_auditoria?: DocumentAuditState;
  token_count: number;
  modelo_ia: string;
  contenido_markdown: string;
}

export interface UpdateDocumentPatch {
  contenido_markdown?: string;
  estado_auditoria?: DocumentAuditState;
}

export const documentRepository = {
  async findByProjectCode(
    codigo_proyecto: string,
  ): Promise<GeneratedDocumentRecord[]> {
    const conn = await getWriteConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const docs = await DocumentoGenerado.find({ codigo_proyecto }).lean<
      DocumentoGeneradoDoc[]
    >();

    return docs.map(toDocumentRecord);
  },

  async findById(id: string): Promise<GeneratedDocumentRecord | null> {
    const conn = await getWriteConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const doc = await DocumentoGenerado.findById(id).lean<DocumentoGeneradoDoc | null>();

    return doc ? toDocumentRecord(doc) : null;
  },

  async findHighTokenDraftsReadOnly(
    minTokens: number = 1200,
  ): Promise<GeneratedDocumentRecord[]> {
    const conn = await getReadOnlyConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const docs = await DocumentoGenerado.find({
      token_count: { $gt: minTokens },
    })
      .sort({ token_count: -1 })
      .lean<DocumentoGeneradoDoc[]>();

    return docs.map(toDocumentRecord);
  },

  async createMany(
    items: CreateDocumentInput[],
  ): Promise<GeneratedDocumentRecord[]> {
    if (items.length === 0) {
      return [];
    }

    const conn = await getWriteConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const inserted = await DocumentoGenerado.insertMany(
      items.map((item) => ({
        ...item,
        estado_auditoria: item.estado_auditoria ?? 'borrador_ia',
      })),
    );
    const ids = inserted.map((doc) => doc._id);
    const docs = await DocumentoGenerado.find({ _id: { $in: ids } }).lean<
      DocumentoGeneradoDoc[]
    >();

    return docs.map(toDocumentRecord);
  },

  async updateById(
    id: string,
    patch: UpdateDocumentPatch,
  ): Promise<GeneratedDocumentRecord | null> {
    const conn = await getWriteConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const updated = await DocumentoGenerado.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true },
    ).lean<DocumentoGeneradoDoc | null>();

    return updated ? toDocumentRecord(updated) : null;
  },

  async deleteByProjectCode(codigo_proyecto: string): Promise<number> {
    const conn = await getWriteConnection();
    const DocumentoGenerado = getDocumentoGeneradoModel(conn);
    const result = await DocumentoGenerado.deleteMany({ codigo_proyecto });
    return result.deletedCount;
  },
};
