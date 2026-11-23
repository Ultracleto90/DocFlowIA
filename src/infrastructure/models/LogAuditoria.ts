import { Schema, type Connection, type Model, type Types } from 'mongoose';
import { AUDIT_RESULTS, type AuditResult } from '@/core/constants/plans';

export interface LogAuditoriaDoc {
  _id: Types.ObjectId;
  usuario: string;
  rol_bd: string;
  accion: string;
  entidad_afectada: string;
  direccion_ip: string;
  resultado: AuditResult;
  timestamp: Date;
}

export const LogAuditoriaSchema = new Schema<LogAuditoriaDoc>(
  {
    usuario: { type: String, required: true },
    rol_bd: { type: String, required: true },
    accion: { type: String, required: true },
    entidad_afectada: { type: String, required: true },
    direccion_ip: { type: String, required: true },
    resultado: { type: String, enum: AUDIT_RESULTS, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    collection: 'logs_auditoria',
    versionKey: false,
  },
);

export function getLogAuditoriaModel(conn: Connection): Model<LogAuditoriaDoc> {
  return (
    (conn.models.LogAuditoria as Model<LogAuditoriaDoc> | undefined) ??
    conn.model<LogAuditoriaDoc>('LogAuditoria', LogAuditoriaSchema)
  );
}
