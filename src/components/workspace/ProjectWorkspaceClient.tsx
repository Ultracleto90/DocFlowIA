'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ProcessingState } from '@/core/constants/plans';
import type {
  AuthUserProfile,
  FilteredComponentRecord,
  GeneratedDocumentRecord,
  ProjectRecord,
} from '@/core/types';
import { AppShell } from '@/components/layout/AppShell';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions, projectPetitions } from '@/services/client/petitions';
import { DocumentSplitEditor } from './DocumentSplitEditor';
import { IntegrationAuditTab } from './IntegrationAuditTab';
import { SvmFilterTable } from './SvmFilterTable';

interface ProjectWorkspaceClientProps {
  codigo: string;
}

type WorkspaceTab = 'docs' | 'svm' | 'integration';

const STATUS_LABELS: Record<ProcessingState, string> = {
  pendiente: 'Pendiente',
  filtrando_svm: 'Filtrando SVM',
  redactando_ia: 'Redactando IA',
  completado: 'Completado',
};

export function ProjectWorkspaceClient({
  codigo,
}: ProjectWorkspaceClientProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [components, setComponents] = useState<FilteredComponentRecord[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocumentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('docs');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [meRes, detailRes] = await Promise.all([
        authPetitions.me(),
        projectPetitions.getByCode(codigo),
      ]);
      setUser(meRes.user);
      setProject(detailRes.project);
      setComponents(detailRes.components);
      setDocuments(detailRes.documents);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 401) {
        router.push(`/login?next=/projects/${encodeURIComponent(codigo)}`);
        return;
      }
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar el workspace del proyecto.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [codigo, router]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  function handleDocumentUpdated(updated: GeneratedDocumentRecord) {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === updated.id ? updated : doc)),
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          Cargando workspace {codigo}...
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="w-full max-w-md rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-docuflow-orange">
            {errorMessage ?? 'Proyecto no disponible.'}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'docs', label: 'Documentación (Split-View)' },
    { id: 'svm', label: `Filtro SVM (${components.length})` },
    { id: 'integration', label: 'Integración y Auditoría' },
  ];

  return (
    <AppShell user={user}>
      {/* Workspace Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-docuflow-primary px-2.5 py-1 font-mono text-xs font-bold text-white">
              {project.codigo_proyecto}
            </span>
            <span className="rounded-lg bg-docuflow-input px-2.5 py-1 text-xs font-semibold text-docuflow-navy">
              {project.framework}
            </span>
            <span className="rounded-full bg-docuflow-cyan/20 px-2.5 py-1 text-xs font-semibold text-docuflow-navy">
              {STATUS_LABELS[project.estado_procesamiento]}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-docuflow-navy">
            {project.nombre_proyecto}
          </h1>
          <p className="text-xs text-docuflow-slate">
            Archivo fuente: <span className="font-mono">{project.archivo_zip}</span>
          </p>
        </div>

        <Link
          href="/dashboard"
          className="shrink-0 rounded-xl border border-docuflow-input bg-docuflow-bg/50 px-4 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Workspace Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-docuflow-input pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLockedIntegration =
            tab.id === 'integration' && !user.plan_details.features.webhooks;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-docuflow-primary text-white shadow-sm'
                  : 'bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
              }`}
            >
              {isLockedIntegration ? <span aria-hidden="true">🔒</span> : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'docs' ? (
        <DocumentSplitEditor
          codigoProyecto={project.codigo_proyecto}
          user={user}
          documents={documents}
          onDocumentUpdated={handleDocumentUpdated}
        />
      ) : activeTab === 'svm' ? (
        <SvmFilterTable components={components} />
      ) : (
        <IntegrationAuditTab
          user={user}
          project={project}
          components={components}
          onProjectUpdated={(updated) => setProject(updated)}
        />
      )}
    </AppShell>
  );
}
