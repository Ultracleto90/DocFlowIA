'use client';

import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { webhookConfigSchema } from '@/core/schemas';
import type {
  AuthUserProfile,
  FilteredComponentRecord,
  ProjectRecord,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { projectPetitions } from '@/services/client/petitions';

interface IntegrationAuditTabProps {
  user: AuthUserProfile;
  project: ProjectRecord;
  components: FilteredComponentRecord[];
  onProjectUpdated: (updated: ProjectRecord) => void;
}

export function IntegrationAuditTab({
  user,
  project,
  components,
  onProjectUpdated,
}: IntegrationAuditTabProps) {
  const [webhookUrl, setWebhookUrl] = useState(project.webhook_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canUseWebhooks = user.plan_details.features.webhooks;
  const relevantViews = components.filter((c) => c.etiqueta_svm === 1);
  const noiseViews = components.filter((c) => c.etiqueta_svm === 0);
  const csrfProtectedCount = relevantViews.filter((c) =>
    c.elementos_detectados.includes('directive_csrf'),
  ).length;

  async function handleSaveWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const parsed = webhookConfigSchema.safeParse({ webhook_url: webhookUrl });
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.flatten().fieldErrors.webhook_url?.[0] ??
          'URL de webhook inválida.',
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await projectPetitions.saveWebhook(
        project.codigo_proyecto,
        parsed.data,
      );
      onProjectUpdated(res.project);
      setStatusMessage('Webhook GitHub/GitLab guardado correctamente.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo guardar la configuración del webhook.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!canUseWebhooks) {
    return (
      <div className="rounded-2xl border border-docuflow-violet/30 bg-docuflow-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-docuflow-violet/10 text-docuflow-violet">
          <Lock className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
          Función disponible desde Plan Team IA ($999 MXN/mes)
        </p>
        <h3 className="mt-2 text-lg font-bold text-docuflow-navy">
          Webhooks GitHub/GitLab y Auditoría Blade/WCAG 2.1 bloqueados
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-docuflow-slate">
          Tu plan actual ({user.plan.nombre}) no incluye integración continua por Webhook ni auditoría avanzada WCAG 2.1 / OWASP. Actualiza a Team IA o Enterprise para desbloquear esta pestaña.
        </p>
        <Link
          href="/billing"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          <span>Ver Planes Team IA y Enterprise</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
          <Webhook className="h-4 w-4 text-docuflow-primary" />
          <span>Webhook GitHub / GitLab CI</span>
        </h3>
        <p className="mt-1 text-xs text-docuflow-slate">
          Configura la URL destino para notificar al repositorio cuando se validen borradores de documentación en {project.codigo_proyecto}.
        </p>

        {statusMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-4 py-2.5 text-xs font-semibold text-docuflow-navy">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
            <span>{statusMessage}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-2.5 text-xs font-semibold text-docuflow-navy"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <form onSubmit={handleSaveWebhook} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="webhook-url"
              className="block text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
            >
              Endpoint del Webhook (HTTPS)
            </label>
            <input
              id="webhook-url"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://gitlab.empresa.com/api/v4/projects/12/trigger"
              className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-docuflow-primary px-5 py-2.5 text-xs font-semibold text-white hover:bg-docuflow-action disabled:opacity-60"
          >
            {isSaving ? 'Guardando...' : 'Guardar Webhook'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
          <ShieldCheck className="h-4 w-4 text-docuflow-violet" />
          <span>Resumen de Auditoría Blade / WCAG 2.1 / OWASP</span>
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-docuflow-bg/60 p-3.5">
            <p className="text-xs text-docuflow-slate">Vistas Funcionales</p>
            <p className="mt-1 text-lg font-bold text-docuflow-primary">
              {relevantViews.length}
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-bg/60 p-3.5">
            <p className="text-xs text-docuflow-slate">Ruido Descartado</p>
            <p className="mt-1 text-lg font-bold text-docuflow-navy">
              {noiseViews.length}
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-bg/60 p-3.5">
            <p className="text-xs text-docuflow-slate">Vistas con @csrf</p>
            <p className="mt-1 text-lg font-bold text-docuflow-cyan">
              {csrfProtectedCount}
            </p>
          </div>
          <div className="rounded-xl bg-docuflow-bg/60 p-3.5">
            <p className="text-xs text-docuflow-slate">Auditoría OWASP</p>
            <p className="mt-1 text-sm font-bold text-docuflow-violet">
              {user.plan_details.features.owasp_audit
                ? 'Activa (Enterprise)'
                : 'WCAG 2.1 (Team IA)'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
