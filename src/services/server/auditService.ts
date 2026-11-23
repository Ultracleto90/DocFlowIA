import type { AuditResult } from '@/core/constants/plans';
import type { AdminAuditResponseDTO, UserRecord } from '@/core/types';
import { auditLogRepository } from '@/infrastructure/repositories/auditLogRepository';
import { documentRepository } from '@/infrastructure/repositories/documentRepository';
import { ServiceError } from './errors';

/**
 * Audit report service strictly backed by read-only MongoDB repositories (`auditor_qa_docuflow`).
 */
export async function getAdminAuditReport(params: {
  user: UserRecord;
  resultado?: AuditResult;
  limit?: number;
}): Promise<AdminAuditResponseDTO> {
  const isAuthorized =
    params.user.rol === 'Administrador' ||
    params.user.plan.nombre === 'Enterprise';

  if (!isAuthorized) {
    throw new ServiceError(
      403,
      'El módulo de Auditoría QA está restringido a rol Administrador o plan Enterprise.',
    );
  }

  const [logs, stats, highTokenDrafts] = await Promise.all([
    auditLogRepository.listReadOnly({
      resultado: params.resultado,
      limit: params.limit ?? 100,
    }),
    auditLogRepository.countStatsReadOnly(),
    documentRepository.findHighTokenDraftsReadOnly(1200),
  ]);

  const totalHighTokenSum = highTokenDrafts.reduce(
    (acc, doc) => acc + doc.token_count,
    0,
  );

  return {
    logs,
    high_token_drafts: highTokenDrafts,
    metrics: {
      total_logs: stats.total,
      exitosos: stats.exitosos,
      bloqueados: stats.bloqueados,
      high_token_drafts_count: highTokenDrafts.length,
      total_high_token_sum: totalHighTokenSum,
      db_account: 'auditor_qa_docuflow',
      db_privilege: 'read',
    },
    ...(params.resultado ? { filter_resultado: params.resultado } : {}),
  };
}
