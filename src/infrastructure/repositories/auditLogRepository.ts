import type { AuditResult } from '@/core/constants/plans';
import type { AuditLogRecord } from '@/core/types';
import {
  getLogAuditoriaModel,
  type LogAuditoriaDoc,
} from '@/infrastructure/models/LogAuditoria';
import { getReadOnlyConnection, getWriteConnection } from '@/lib/db/mongodb';

function toAuditLogRecord(doc: LogAuditoriaDoc): AuditLogRecord {
  return {
    id: doc._id.toString(),
    usuario: doc.usuario,
    rol_bd: doc.rol_bd,
    accion: doc.accion,
    entidad_afectada: doc.entidad_afectada,
    direccion_ip: doc.direccion_ip,
    resultado: doc.resultado,
    timestamp:
      doc.timestamp instanceof Date
        ? doc.timestamp.toISOString()
        : new Date(doc.timestamp).toISOString(),
  };
}

export interface CreateAuditLogInput {
  usuario: string;
  rol_bd: string;
  accion: string;
  entidad_afectada: string;
  direccion_ip: string;
  resultado: AuditResult;
}

export interface ListAuditLogsFilter {
  resultado?: AuditResult;
  limit?: number;
}

export const auditLogRepository = {
  async create(entry: CreateAuditLogInput): Promise<AuditLogRecord> {
    const conn = await getWriteConnection();
    const LogAuditoria = getLogAuditoriaModel(conn);
    const created = await LogAuditoria.create({
      ...entry,
      timestamp: new Date(),
    });

    const plain = await LogAuditoria.findById(
      created._id,
    ).lean<LogAuditoriaDoc | null>();
    if (!plain) {
      throw new Error('Failed to reload created audit log');
    }

    return toAuditLogRecord(plain);
  },

  async listReadOnly(
    filter: ListAuditLogsFilter = {},
  ): Promise<AuditLogRecord[]> {
    const conn = await getReadOnlyConnection();
    const LogAuditoria = getLogAuditoriaModel(conn);
    const query = filter.resultado ? { resultado: filter.resultado } : {};
    const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);

    const docs = await LogAuditoria.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<LogAuditoriaDoc[]>();

    return docs.map(toAuditLogRecord);
  },

  async countStatsReadOnly(): Promise<{
    total: number;
    exitosos: number;
    bloqueados: number;
  }> {
    const conn = await getReadOnlyConnection();
    const LogAuditoria = getLogAuditoriaModel(conn);

    const [total, exitosos, bloqueados] = await Promise.all([
      LogAuditoria.countDocuments(),
      LogAuditoria.countDocuments({ resultado: 'EXITOSO' }),
      LogAuditoria.countDocuments({ resultado: 'BLOQUEADO_UNAUTHORIZED' }),
    ]);

    return { total, exitosos, bloqueados };
  },
};
