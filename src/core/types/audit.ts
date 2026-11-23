import type { AuditResult } from '@/core/constants/plans';

export interface AuditLogRecord {
  id: string;
  usuario: string;
  rol_bd: string;
  accion: string;
  entidad_afectada: string;
  direccion_ip: string;
  resultado: AuditResult;
  timestamp: string;
}
