'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  FolderArchive,
  FolderTree,
  Lock,
  Network,
  Package,
  ShieldCheck,
  Webhook,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ProcessingState } from '@/core/constants/plans';
import type {
  AuthUserProfile,
  FilteredComponentRecord,
  GeneratedDocumentRecord,
  ProjectRecord,
  ProjectTopologyRecord,
} from '@/core/types';
import { AppShell } from '@/components/layout/AppShell';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions, projectPetitions } from '@/services/client/petitions';
import { DocumentSplitEditor } from './DocumentSplitEditor';
import { IntegrationAuditTab } from './IntegrationAuditTab';
import { SecurityStrideTab } from './SecurityStrideTab';
import { SvmFilterTable } from './SvmFilterTable';
import { TopologyGraphTab } from './TopologyGraphTab';

interface ProjectWorkspaceClientProps {
  codigo: string;
}

type WorkspaceTab = 'docs' | 'topology' | 'svm' | 'security' | 'integration';

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
  const [topology, setTopology] = useState<ProjectTopologyRecord | null>(null);
  const [topologyLoading, setTopologyLoading] = useState(false);
  const [topologyError, setTopologyError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('docs');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false);
  const [contextCopied, setContextCopied] = useState(false);
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

  const loadTopology = useCallback(async () => {
    setTopologyLoading(true);
    setTopologyError(null);
    try {
      const res = await projectPetitions.getTopology(codigo);
      setTopology(res.topology);
      return res.topology;
    } catch (err: unknown) {
      const msg =
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar la topología IA del proyecto.';
      setTopologyError(msg);
      return null;
    } finally {
      setTopologyLoading(false);
    }
  }, [codigo]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (activeTab === 'topology' && !topology && !topologyLoading) {
      void loadTopology();
    }
  }, [activeTab, loadTopology, topology, topologyLoading]);

  async function handleCopyAgentContext() {
    if (!project) return;
    const loaded = topology ?? (await loadTopology());
    if (!loaded) return;

    const contextPayload = [
      `# Contexto para Agente IA - ${project.nombre_proyecto} (${project.codigo_proyecto})`,
      loaded.llms_txt,
      '---',
      loaded.topology_markdown,
    ].join('\n\n');

    try {
      await navigator.clipboard.writeText(contextPayload);
      setContextCopied(true);
      window.setTimeout(() => setContextCopied(false), 2500);
    } catch {
      // Ignore clipboard denial
    }
  }

  async function handleDownloadBundle() {
    if (!project) return;
    setIsDownloadingBundle(true);
    try {
      await projectPetitions.downloadBundle(project.codigo_proyecto);
    } finally {
      setIsDownloadingBundle(false);
    }
  }

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
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const securityUnlocked =
    user.plan.nombre === 'Team IA' || user.plan.nombre === 'Enterprise';

  const tabs = [
    {
      id: 'docs' as const,
      label: 'Documentación (Split-View)',
      icon: FileText,
      locked: false,
    },
    {
      id: 'topology' as const,
      label: 'Topología IA',
      icon: Network,
      locked: false,
    },
    {
      id: 'svm' as const,
      label: `Filtro SVM (${components.length})`,
      icon: Filter,
      locked: false,
    },
    {
      id: 'security' as const,
      label: 'Seguridad (OWASP / STRIDE)',
      icon: ShieldCheck,
      locked: !securityUnlocked,
    },
    {
      id: 'integration' as const,
      label: 'Integración y Auditoría',
      icon: Webhook,
      locked: !user.plan_details.features.webhooks,
    },
  ];

  return (
    <AppShell user={user}>
      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-xs font-medium text-docuflow-slate"
      >
        <Link href="/dashboard" className="hover:text-docuflow-primary">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/files" className="hover:text-docuflow-primary">
          Biblioteca
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-docuflow-navy">
          {project.codigo_proyecto}
        </span>
      </nav>

      {/* Workspace Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm xl:flex-row xl:items-center">
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
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-docuflow-slate">
            <FolderArchive className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Archivo fuente:</span>
            <span className="font-mono">{project.archivo_zip}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={topologyLoading}
            onClick={() => void handleCopyAgentContext()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3.5 py-2 text-xs font-semibold text-docuflow-navy transition-colors hover:border-docuflow-primary disabled:opacity-60"
          >
            {contextCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-docuflow-cyan" />
                <span>Contexto copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-docuflow-primary" />
                <span>Copiar Contexto para Agente IA</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isDownloadingBundle}
            onClick={() => void handleDownloadBundle()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-cyan px-3.5 py-2 text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Package className="h-3.5 w-3.5" />
            <span>
              {isDownloadingBundle
                ? 'Empaquetando .zip...'
                : 'Descargar Kit Completo (.zip)'}
            </span>
          </button>

          <Link
            href={`/files?project=${encodeURIComponent(project.codigo_proyecto)}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-input bg-docuflow-bg/50 px-3.5 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
          >
            <FolderTree className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Ver carpeta</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-docuflow-input bg-docuflow-bg/50 px-3.5 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-docuflow-input pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                isActive
                  ? 'text-white'
                  : 'bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="workspaceActiveTab"
                  transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-docuflow-primary shadow-sm"
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.locked ? (
                  <Lock className="h-3.5 w-3.5 text-docuflow-orange" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {activeTab === 'docs' ? (
            <DocumentSplitEditor
              codigoProyecto={project.codigo_proyecto}
              user={user}
              documents={documents}
              onDocumentUpdated={handleDocumentUpdated}
            />
          ) : activeTab === 'topology' ? (
            <TopologyGraphTab
              codigoProyecto={project.codigo_proyecto}
              topology={topology}
              isLoading={topologyLoading}
              errorMessage={topologyError}
              onRetry={() => void loadTopology()}
            />
          ) : activeTab === 'svm' ? (
            <SvmFilterTable components={components} />
          ) : activeTab === 'security' ? (
            <SecurityStrideTab
              codigoProyecto={project.codigo_proyecto}
              user={user}
            />
          ) : (
            <IntegrationAuditTab
              user={user}
              project={project}
              components={components}
              onProjectUpdated={(updated) => setProject(updated)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
