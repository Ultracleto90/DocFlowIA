'use client';

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileWarning,
  Filter,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { AuditResult } from '@/core/constants/plans';
import type { AdminAuditResponseDTO, AuthUserProfile } from '@/core/types';
import { AppShell } from '@/components/layout/AppShell';
import { HttpError } from '@/lib/http/basicGet';
import { auditPetitions, authPetitions } from '@/services/client/petitions';

type AuditFilter = 'ALL' | AuditResult;

export function AuditClient() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [report, setReport] = useState<AdminAuditResponseDTO | null>(null);
  const [filter, setFilter] = useState<AuditFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAudit = useCallback(
    async (selectedFilter: AuditFilter) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [meRes, auditRes] = await Promise.all([
          authPetitions.me(),
          auditPetitions.listLogs(
            selectedFilter === 'ALL' ? undefined : selectedFilter,
          ),
        ]);
        setUser(meRes.user);
        setReport(auditRes);
      } catch (err: unknown) {
        if (err instanceof HttpError && err.status === 401) {
          router.push('/login?next=/admin/audit');
          return;
        }
        setErrorMessage(
          err instanceof HttpError
            ? err.message
            : 'No se pudo cargar la bitácora de auditoría QA.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    void loadAudit(filter);
  }, [filter, loadAudit]);

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          {errorMessage ?? 'Conectando como auditor_qa_docuflow (solo lectura)...'}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-docuflow-orange">
            {errorMessage ?? 'Acceso denegado.'}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-docuflow-navy">
            <ShieldCheck className="h-5 w-5 text-docuflow-primary" />
            <span>Bitácora de Seguridad y Auditoría QA</span>
          </h1>
          <p className="mt-1 text-sm text-docuflow-slate">
            Consulta cronológica de eventos y borradores de alto consumo de tokens bajo principio de mínimo privilegio.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-docuflow-cyan/50 bg-docuflow-surface px-4 py-2 text-xs font-bold text-docuflow-navy shadow-sm">
          <Database className="h-4 w-4 text-docuflow-cyan" />
          <span>
            Conexión activa:{' '}
            <code className="font-mono text-docuflow-primary">
              {report?.metrics.db_account ?? 'auditor_qa_docuflow'}
            </code>{' '}
            ({report?.metrics.db_privilege ?? 'read'}-only)
          </span>
        </div>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-2xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-5 py-3.5 text-sm font-semibold text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {report ? (
        <>
          {/* Metrics Cards */}
          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
                <Activity className="h-4 w-4 text-docuflow-primary" />
                <span>Eventos en Bitácora</span>
              </p>
              <p className="mt-2 text-2xl font-extrabold text-docuflow-navy">
                {report.metrics.total_logs}
              </p>
            </div>
            <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
                <CheckCircle2 className="h-4 w-4 text-docuflow-cyan" />
                <span>Eventos EXITOSO</span>
              </p>
              <p className="mt-2 text-2xl font-extrabold text-docuflow-cyan">
                {report.metrics.exitosos}
              </p>
            </div>
            <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
                <ShieldAlert className="h-4 w-4 text-docuflow-orange" />
                <span>BLOQUEADO_UNAUTHORIZED</span>
              </p>
              <p className="mt-2 text-2xl font-extrabold text-docuflow-orange">
                {report.metrics.bloqueados}
              </p>
            </div>
            <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
                <FileWarning className="h-4 w-4 text-docuflow-violet" />
                <span>Borradores &gt; 1,200 tokens</span>
              </p>
              <p className="mt-2 text-2xl font-extrabold text-docuflow-violet">
                {report.metrics.high_token_drafts_count}
              </p>
              <p className="mt-0.5 text-[11px] text-docuflow-slate">
                {report.metrics.total_high_token_sum.toLocaleString()} tokens acumulados
              </p>
            </div>
          </section>

          {/* Audit Logs Table */}
          <section className="mb-8 overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-docuflow-input px-6 py-4 sm:flex-row sm:items-center">
              <h2 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
                <Filter className="h-4 w-4 text-docuflow-primary" />
                <span>Eventos Cronológicos (logs_auditoria)</span>
              </h2>

              <div className="flex flex-wrap gap-2">
                {(['ALL', 'EXITOSO', 'BLOQUEADO_UNAUTHORIZED'] as const).map(
                  (opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFilter(opt)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        filter === opt
                          ? 'bg-docuflow-primary text-white'
                          : 'bg-docuflow-input text-docuflow-slate hover:text-docuflow-navy'
                      }`}
                    >
                      {opt === 'ALL' ? 'Todos' : opt}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-docuflow-bg/50 font-semibold uppercase tracking-wide text-docuflow-slate">
                  <tr>
                    <th className="px-5 py-3">Fecha / Hora</th>
                    <th className="px-5 py-3">Usuario</th>
                    <th className="px-5 py-3">Rol BD</th>
                    <th className="px-5 py-3">Acción</th>
                    <th className="px-5 py-3">Entidad Afectada</th>
                    <th className="px-5 py-3">IP Real</th>
                    <th className="px-5 py-3">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-docuflow-input">
                  {report.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-docuflow-bg/25">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-docuflow-slate">
                        {new Date(log.timestamp).toLocaleString('es-MX')}
                      </td>
                      <td className="px-5 py-3 font-semibold text-docuflow-navy">
                        {log.usuario}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-docuflow-primary">
                        {log.rol_bd}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] font-semibold text-docuflow-navy">
                        {log.accion}
                      </td>
                      <td className="px-5 py-3 text-docuflow-slate">
                        {log.entidad_afectada}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-docuflow-slate">
                        {log.direccion_ip}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            log.resultado === 'EXITOSO'
                              ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                              : 'bg-docuflow-orange/20 text-docuflow-orange'
                          }`}
                        >
                          {log.resultado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* High Token Drafts Table */}
          <section className="overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
            <div className="border-b border-docuflow-input px-6 py-4">
              <h2 className="text-base font-bold text-docuflow-navy">
                Borradores IA pendientes con token_count &gt; 1,200
              </h2>
              <p className="text-xs text-docuflow-slate">
                Documentos en estado <code className="rounded bg-docuflow-input px-1">borrador_ia</code> que requieren revisión humana prioritaria.
              </p>
            </div>

            {report.high_token_drafts.length === 0 ? (
              <div className="p-6 text-center text-xs text-docuflow-slate">
                No hay borradores pendientes que superen los 1,200 tokens.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-docuflow-bg/50 font-semibold uppercase tracking-wide text-docuflow-slate">
                    <tr>
                      <th className="px-5 py-3">Proyecto</th>
                      <th className="px-5 py-3">Documento Normativo</th>
                      <th className="px-5 py-3">Modelo IA</th>
                      <th className="px-5 py-3">Tokens</th>
                      <th className="px-5 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-docuflow-input">
                    {report.high_token_drafts.map((doc) => (
                      <tr key={doc.id} className="hover:bg-docuflow-bg/25">
                        <td className="px-5 py-3 font-mono font-bold text-docuflow-primary">
                          {doc.codigo_proyecto}
                        </td>
                        <td className="px-5 py-3 font-semibold text-docuflow-navy">
                          {doc.tipo_documento}
                        </td>
                        <td className="px-5 py-3 text-docuflow-slate">
                          {doc.modelo_ia}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded-full bg-docuflow-violet/15 px-2.5 py-0.5 font-bold text-docuflow-violet">
                            {doc.token_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/projects/${doc.codigo_proyecto}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-docuflow-primary px-3 py-1.5 font-semibold text-white hover:bg-docuflow-action"
                          >
                            <span>Auditar</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
