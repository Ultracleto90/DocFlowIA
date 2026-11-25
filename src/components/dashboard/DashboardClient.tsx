'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FolderArchive,
  Gauge,
  HardDrive,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { ProcessingState } from '@/core/constants/plans';
import type {
  AuthUserProfile,
  CreateProjectResponseDTO,
  PlanUsageSummary,
  ProjectRecord,
} from '@/core/types';
import { AppShell } from '@/components/layout/AppShell';
import { StaggerGrid, StaggerItem } from '@/components/motion/MotionPrimitives';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions, projectPetitions } from '@/services/client/petitions';
import { FreemiumAdBanner } from './FreemiumAdBanner';
import { UploadProjectModal } from './UploadProjectModal';

const STATUS_BADGES: Record<ProcessingState, { label: string; classes: string }> = {
  pendiente: {
    label: 'Pendiente',
    classes: 'bg-docuflow-input text-docuflow-slate',
  },
  filtrando_svm: {
    label: 'Filtrando SVM',
    classes: 'bg-docuflow-cyan/15 text-docuflow-primary',
  },
  redactando_ia: {
    label: 'Redactando IA',
    classes: 'bg-docuflow-violet/15 text-docuflow-violet',
  },
  completado: {
    label: 'Completado',
    classes: 'bg-docuflow-cyan/20 text-docuflow-navy',
  },
};

export function DashboardClient() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [usage, setUsage] = useState<PlanUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] =
    useState<ProjectRecord | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [meRes, projectsRes] = await Promise.all([
        authPetitions.me(),
        projectPetitions.list(),
      ]);
      setUser(meRes.user);
      setProjects(projectsRes.projects);
      setUsage(projectsRes.usage);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 401) {
        router.push('/login?next=/dashboard');
        return;
      }
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar la información del dashboard.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleConfirmDeleteProject() {
    if (!pendingDeleteProject) return;
    const codigo = pendingDeleteProject.codigo_proyecto;
    setDeletingCode(codigo);
    setErrorMessage(null);
    try {
      await projectPetitions.delete(codigo);
      setPendingDeleteProject(null);
      setToastMessage(`Proyecto ${codigo} eliminado correctamente.`);
      await loadDashboard();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo eliminar el proyecto.',
      );
    } finally {
      setDeletingCode(null);
    }
  }

  function handleUploadSuccess(created: CreateProjectResponseDTO) {
    setToastMessage(
      `Proyecto ${created.project.codigo_proyecto} procesado: ${created.summary.relevant_views} vistas relevantes y ${created.summary.documents_generated} documentos generados.`,
    );
    void loadDashboard();
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          {errorMessage ?? 'Cargando espacio de trabajo DocuFlow AI...'}
        </div>
      </div>
    );
  }

  const activeUsage = usage ?? user.usage;
  const quotaPercent = Math.min(
    100,
    Math.round(
      (activeUsage.proyectos_mes_actual /
        Math.max(1, activeUsage.max_proyectos_mes)) *
        100,
    ),
  );

  return (
    <AppShell user={user}>
      {user.plan_details.tiene_anuncios ? <FreemiumAdBanner /> : null}

      {toastMessage ? (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-docuflow-cyan/40 bg-docuflow-surface px-5 py-3.5 text-sm text-docuflow-navy shadow-sm">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
            <span>{toastMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs font-semibold text-docuflow-slate hover:text-docuflow-navy"
          >
            Ocultar
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-2xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-5 py-3.5 text-sm text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Top Header + Action */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-docuflow-navy">
            Proyectos Laravel
          </h1>
          <p className="mt-1 text-sm text-docuflow-slate">
            Sube un archivo <code className="rounded bg-docuflow-input px-1.5 py-0.5 text-xs text-docuflow-primary">.zip</code>, ejecuta el filtro SVM y valida la documentación normativa generada.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-docuflow-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-docuflow-action active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Proyecto Laravel (.zip)</span>
        </button>
      </div>

      {/* Quota & Plan Metrics */}
      <StaggerGrid className="mb-8 grid gap-4 md:grid-cols-3">
        <StaggerItem className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-xs font-semibold text-docuflow-slate">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-docuflow-cyan" />
              Cuota Mensual ({user.plan.nombre})
            </span>
            <span className="text-docuflow-navy">
              {activeUsage.proyectos_mes_actual} / {activeUsage.max_proyectos_mes}
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-docuflow-input">
            <div
              className={`h-full rounded-full transition-all ${
                quotaPercent >= 90 ? 'bg-docuflow-orange' : 'bg-docuflow-cyan'
              }`}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-docuflow-slate">
            {activeUsage.restantes_mes} proyectos disponibles este mes
          </p>
        </StaggerItem>

        <StaggerItem className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
            <Sparkles className="h-4 w-4 text-docuflow-violet" />
            Inteligencia Activa ({user.plan_details.nivel_ia})
          </p>
          <p className="mt-2 text-base font-bold text-docuflow-violet">
            {user.plan_details.modelo_ia}
          </p>
          <p className="mt-1 text-xs text-docuflow-slate">
            {user.plan_details.entregables.length} entregable(s) desbloqueado(s)
          </p>
        </StaggerItem>

        <StaggerItem className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate">
            <HardDrive className="h-4 w-4 text-docuflow-primary" />
            Capacidad de Ingesta y Almacenamiento
          </p>
          <p className="mt-2 text-base font-bold text-docuflow-navy">
            {user.plan_details.max_zip_mb} MB / .zip | {user.plan_details.max_vistas_blade} vistas
          </p>
          <p className="mt-1 text-xs text-docuflow-slate">
            {user.plan_details.almacenamiento_gb} GB asignados ({user.plan_details.pdf_habilitado ? 'MD + PDF limpio' : 'Solo .md con firma'})
          </p>
        </StaggerItem>
      </StaggerGrid>

      {/* Projects Table */}
      <section className="overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-docuflow-input px-6 py-4 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
            <FolderArchive className="h-4 w-4 text-docuflow-primary" />
            <span>Repositorio de Proyectos ({projects.length})</span>
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-docuflow-slate">
            <span>Regla 3 clics: Subir</span>
            <ArrowRight className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Abrir</span>
            <ArrowRight className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Auditar/Exportar</span>
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-docuflow-navy">
              Aún no tienes proyectos registrados
            </p>
            <p className="mt-1 text-xs text-docuflow-slate">
              Haz clic en &ldquo;Nuevo Proyecto Laravel (.zip)&rdquo; para analizar tus vistas Blade.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-docuflow-bg/50 text-xs font-semibold uppercase tracking-wide text-docuflow-slate">
                <tr>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Proyecto</th>
                  <th className="px-6 py-3.5">Framework</th>
                  <th className="px-6 py-3.5">Propietario</th>
                  <th className="px-6 py-3.5">Estado</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-docuflow-input">
                {projects.map((project, index) => {
                  const badge = STATUS_BADGES[project.estado_procesamiento];
                  return (
                    <motion.tr
                      key={project.codigo_proyecto}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(index * 0.04, 0.25),
                        ease: 'easeOut',
                      }}
                      className="transition-colors hover:bg-docuflow-bg/30"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-bold text-docuflow-primary">
                        {project.codigo_proyecto}
                      </td>
                      <td className="px-6 py-4 font-semibold text-docuflow-navy">
                        {project.nombre_proyecto}
                      </td>
                      <td className="px-6 py-4 text-xs text-docuflow-slate">
                        {project.framework}
                      </td>
                      <td className="px-6 py-4 text-xs text-docuflow-slate">
                        {project.usuario_correo}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/projects/${project.codigo_proyecto}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-docuflow-primary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-docuflow-action active:scale-[0.98]"
                          >
                            <span>Abrir Workspace</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteProject(project)}
                            disabled={deletingCode === project.codigo_proyecto}
                            className="inline-flex items-center gap-1 rounded-lg border border-docuflow-input px-3 py-1.5 text-xs font-semibold text-docuflow-slate transition-all hover:border-docuflow-orange hover:text-docuflow-orange active:scale-[0.98] disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>
                              {deletingCode === project.codigo_proyecto
                                ? 'Eliminando...'
                                : 'Eliminar'}
                            </span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <UploadProjectModal
        open={isUploadOpen}
        user={user}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <ConfirmDialog
        open={pendingDeleteProject !== null}
        title={
          pendingDeleteProject
            ? `Eliminar proyecto ${pendingDeleteProject.codigo_proyecto}`
            : 'Eliminar proyecto'
        }
        description={
          pendingDeleteProject
            ? `Esta acción eliminará "${pendingDeleteProject.nombre_proyecto}", sus componentes SVM y sus documentos generados. Si no estás seguro, haz clic en Cancelar.`
            : ''
        }
        confirmLabel="Sí, eliminar proyecto"
        isLoading={deletingCode !== null}
        onConfirm={() => void handleConfirmDeleteProject()}
        onCancel={() => !deletingCode && setPendingDeleteProject(null)}
      />
    </AppShell>
  );
}
