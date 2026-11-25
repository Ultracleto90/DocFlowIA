'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type {
  AuthUserProfile,
  ProjectSecurityResponseDTO,
  SecuritySeverity,
  StrideStatus,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { projectPetitions } from '@/services/client/petitions';

interface SecurityStrideTabProps {
  codigoProyecto: string;
  user: AuthUserProfile;
}

type SeverityFilter = 'all' | SecuritySeverity;

const SEVERITY_STYLES: Record<SecuritySeverity, string> = {
  critica: 'bg-docuflow-orange text-white',
  alta: 'bg-docuflow-orange/20 text-docuflow-orange',
  media: 'bg-docuflow-violet/20 text-docuflow-violet',
  baja: 'bg-docuflow-input text-docuflow-slate',
};

const STRIDE_STATUS_STYLES: Record<StrideStatus, string> = {
  mitigado: 'bg-docuflow-cyan/20 text-docuflow-navy',
  atencion: 'bg-docuflow-violet/20 text-docuflow-violet',
  riesgo: 'bg-docuflow-orange/20 text-docuflow-orange',
};

export function SecurityStrideTab({
  codigoProyecto,
  user,
}: SecurityStrideTabProps) {
  const [data, setData] = useState<ProjectSecurityResponseDTO | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSecurity = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await projectPetitions.getSecurity(codigoProyecto);
      setData(response);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo ejecutar el análisis estático de seguridad.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [codigoProyecto]);

  useEffect(() => {
    void loadSecurity();
  }, [loadSecurity]);

  async function handleDownloadSecurityReport() {
    setIsDownloading(true);
    try {
      await projectPetitions.downloadArtifact(
        codigoProyecto,
        'security_md',
        `${codigoProyecto}_SECURITY_REPORT.md`,
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-8 text-center text-sm text-docuflow-slate">
        Ejecutando escáner estático Blade (OWASP / STRIDE) en {codigoProyecto}...
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="rounded-2xl border border-docuflow-orange/40 bg-docuflow-surface p-8 text-center">
        <p className="text-sm font-semibold text-docuflow-orange">
          {errorMessage ?? 'Reporte de seguridad no disponible.'}
        </p>
        <button
          type="button"
          onClick={() => void loadSecurity()}
          className="mt-4 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action"
        >
          Reintentar escaneo
        </button>
      </div>
    );
  }

  const { report, unlocked } = data;
  const { summary, findings, stride_matrix } = report;

  if (!unlocked) {
    return (
      <div className="space-y-6">
        {/* Telemetry Preview Metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
            <p className="text-xs text-docuflow-slate">Vistas Blade escaneadas</p>
            <p className="mt-1 font-display text-2xl font-bold text-docuflow-navy">
              {summary.scanned_views}
            </p>
          </div>
          <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
            <p className="text-xs text-docuflow-slate">Cobertura @csrf detectada</p>
            <p className="mt-1 font-display text-2xl font-bold text-docuflow-cyan">
              {summary.forms_with_csrf} / {summary.forms_total}
            </p>
          </div>
          <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
            <p className="text-xs text-docuflow-slate">Hallazgos estáticos</p>
            <p className="mt-1 font-display text-2xl font-bold text-docuflow-orange">
              {summary.total_findings}
            </p>
          </div>
        </div>

        {/* Locked Upsell Card */}
        <div className="rounded-2xl border border-docuflow-violet/35 bg-docuflow-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-docuflow-violet/15 text-docuflow-violet">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
            Módulo Seguridad OWASP &amp; Matriz STRIDE bloqueado en {user.plan.nombre}
          </p>
          <h3 className="mt-2 font-display text-lg font-bold text-docuflow-navy">
            Desbloquea hallazgos por línea Blade y la matriz STRIDE completa
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-docuflow-slate">
            El escáner detectó {summary.total_findings} hallazgo(s) potenciales y evaluó las 6 categorías STRIDE para tus formularios y rutas. Actualiza a Team IA o Enterprise para inspeccionar el detalle por archivo y descargar el reporte de auditoría.
          </p>

          <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2 opacity-75">
            {stride_matrix.map((row) => (
              <span
                key={row.category}
                className="inline-flex items-center gap-1 rounded-full border border-docuflow-border bg-docuflow-elevated px-3 py-1 text-[11px] font-semibold text-docuflow-navy"
              >
                <Lock className="h-3 w-3 text-docuflow-violet" />
                <span>{row.category}</span>
              </span>
            ))}
          </div>

          <Link
            href="/billing?plan=team"
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            <span>Actualizar a Team IA o Enterprise</span>
          </Link>
        </div>
      </div>
    );
  }

  const visibleFindings =
    severityFilter === 'all'
      ? findings
      : findings.filter((f) => f.severity === severityFilter);

  return (
    <div className="space-y-6">
      {/* Executive Summary Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-docuflow-elevated p-3">
            <p className="text-[11px] text-docuflow-slate">Postura Estática</p>
            <p className="mt-0.5 text-sm font-bold uppercase text-docuflow-cyan">
              {summary.posture}
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-elevated p-3">
            <p className="text-[11px] text-docuflow-slate">Formularios con @csrf</p>
            <p className="mt-0.5 text-sm font-bold text-docuflow-navy">
              {summary.forms_with_csrf} de {summary.forms_total}
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-elevated p-3">
            <p className="text-[11px] text-docuflow-slate">Expresiones {'{{ }}'}</p>
            <p className="mt-0.5 text-sm font-bold text-docuflow-primary">
              {summary.escaped_expressions} escapadas
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-elevated p-3">
            <p className="text-[11px] text-docuflow-slate">Hallazgos Totales</p>
            <p className="mt-0.5 text-sm font-bold text-docuflow-orange">
              {summary.total_findings}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isDownloading}
          onClick={() => void handleDownloadSecurityReport()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-docuflow-cyan px-4 py-2.5 text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          <span>
            {isDownloading
              ? 'Descargando...'
              : 'Descargar SECURITY_REPORT.md'}
          </span>
        </button>
      </div>

      {/* Findings Section */}
      <section className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
            <ShieldAlert className="h-4 w-4 text-docuflow-orange" />
            <span>Hallazgos Estáticos por Plantilla Blade</span>
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'all', label: `Todos (${findings.length})` },
                { id: 'critica', label: `Crítica (${summary.critica})` },
                { id: 'alta', label: `Alta (${summary.alta})` },
                { id: 'media', label: `Media (${summary.media})` },
                { id: 'baja', label: `Baja (${summary.baja})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSeverityFilter(f.id)}
                className={`rounded-xl px-3 py-1 text-[11px] font-semibold transition-colors ${
                  severityFilter === f.id
                    ? 'bg-docuflow-primary text-white'
                    : 'bg-docuflow-elevated text-docuflow-slate hover:text-docuflow-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visibleFindings.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 p-4 text-xs text-docuflow-navy">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
            <span>
              Sin hallazgos registrados para el filtro seleccionado. Controles básicos de Blade verificados.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleFindings.map((finding) => (
              <article
                key={finding.id}
                className="rounded-xl border border-docuflow-border bg-docuflow-elevated/60 p-4 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        SEVERITY_STYLES[finding.severity]
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <h4 className="font-bold text-docuflow-navy">
                      {finding.title}
                    </h4>
                  </div>
                  <span className="rounded-md bg-docuflow-surface px-2 py-0.5 text-[10px] font-semibold text-docuflow-violet">
                    {finding.owasp_category} | STRIDE: {finding.stride_category}
                  </span>
                </div>

                <p className="mt-2 font-mono text-[11px] text-docuflow-slate">
                  {finding.archivo_blade} (Línea {finding.line_number})
                </p>

                <pre className="mt-2 overflow-x-auto rounded-lg bg-docuflow-bg px-3 py-2 font-mono text-[11px] text-docuflow-navy">
                  {finding.snippet}
                </pre>

                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-docuflow-slate">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                  <span>{finding.recommendation}</span>
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* STRIDE Threat Matrix */}
      <section className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-docuflow-navy">
          <ShieldCheck className="h-4 w-4 text-docuflow-cyan" />
          <span>Matriz de Amenazas STRIDE (Rutas y Formularios Detectados)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-docuflow-border text-[11px] font-bold uppercase tracking-wide text-docuflow-slate">
                <th className="py-2.5 pr-4">Categoría STRIDE</th>
                <th className="py-2.5 pr-4">Estado</th>
                <th className="py-2.5 pr-4">Rutas / Formularios</th>
                <th className="py-2.5 pr-4">Evidencia Estática</th>
                <th className="py-2.5">Mitigación Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-docuflow-border">
              {stride_matrix.map((row) => (
                <tr key={row.category} className="align-top">
                  <td className="py-3 pr-4 font-bold text-docuflow-navy">
                    <p>{row.category}</p>
                    <p className="mt-0.5 text-[11px] font-normal text-docuflow-slate">
                      {row.threat_summary}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        STRIDE_STATUS_STYLES[row.status]
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-docuflow-navy">
                    {row.affected_targets.join(', ')}
                  </td>
                  <td className="py-3 pr-4 text-[11px] text-docuflow-slate">
                    {row.evidence}
                  </td>
                  <td className="py-3 text-[11px] text-docuflow-navy">
                    {row.mitigation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
