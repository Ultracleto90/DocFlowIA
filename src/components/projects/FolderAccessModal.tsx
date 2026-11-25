'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import type { PlanName } from '@/core/constants/plans';
import { folderAccessEntrySchema } from '@/core/schemas';
import {
  FOLDER_ACCESS_ROLES,
  type FolderAccessRole,
  type ProjectRecord,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { projectPetitions } from '@/services/client/petitions';

const ROLE_LABELS: Record<FolderAccessRole, string> = {
  lectura: 'Solo lectura',
  edicion: 'Edición Markdown',
  validador: 'Validador QA',
};

interface FolderAccessPanelProps {
  project: ProjectRecord;
  userPlan: PlanName;
  onProjectUpdated: (updated: ProjectRecord) => void;
}

export function FolderAccessPanel({
  project,
  userPlan,
  onProjectUpdated,
}: FolderAccessPanelProps) {
  const isAclUnlocked = userPlan === 'Team IA' || userPlan === 'Enterprise';

  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<FolderAccessRole>('lectura');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const permissions = project.permisos_acceso ?? [];

  if (!isAclUnlocked) {
    return (
      <div className="rounded-2xl border border-docuflow-violet/30 bg-docuflow-elevated/50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-docuflow-violet/15 text-docuflow-violet">
          <Lock className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
          Control de Accesos por Carpeta (ACL) bloqueado en {userPlan}
        </p>
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-docuflow-slate">
          Asigna permisos granulares (Lectura, Edición o Validador QA) por carpeta de proyecto. Disponible a partir del plan Team IA o Enterprise.
        </p>
        <Link
          href="/billing?plan=team"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Actualizar a Team IA o Enterprise</span>
        </Link>
      </div>
    );
  }

  async function persistList(
    nextList: Array<{ email: string; rol_carpeta: FolderAccessRole }>,
  ) {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await projectPetitions.updateAccess(
        project.codigo_proyecto,
        { permisos_acceso: nextList },
      );
      onProjectUpdated(response.project);
      setStatusMessage(response.message);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudieron actualizar los permisos de la carpeta.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddPermission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const parsed = folderAccessEntrySchema.safeParse({
      email: emailInput,
      rol_carpeta: roleInput,
    });
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? 'Correo o rol inválido.',
      );
      return;
    }

    const normalizedEmail = parsed.data.email.toLowerCase();
    if (normalizedEmail === project.usuario_correo.toLowerCase()) {
      setErrorMessage(
        'El propietario del proyecto ya posee acceso total a esta carpeta.',
      );
      return;
    }

    const nextMap = new Map<
      string,
      { email: string; rol_carpeta: FolderAccessRole }
    >();
    for (const item of permissions) {
      nextMap.set(item.email.toLowerCase(), {
        email: item.email,
        rol_carpeta: item.rol_carpeta,
      });
    }
    nextMap.set(normalizedEmail, {
      email: normalizedEmail,
      rol_carpeta: parsed.data.rol_carpeta,
    });

    await persistList(Array.from(nextMap.values()));
    setEmailInput('');
  }

  async function handleRoleChange(email: string, nextRole: FolderAccessRole) {
    const nextList = permissions.map((item) => ({
      email: item.email,
      rol_carpeta: item.email === email ? nextRole : item.rol_carpeta,
    }));
    await persistList(nextList);
  }

  async function handleRevoke(email: string) {
    const nextList = permissions
      .filter((item) => item.email !== email)
      .map((item) => ({
        email: item.email,
        rol_carpeta: item.rol_carpeta,
      }));
    await persistList(nextList);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-docuflow-border bg-docuflow-elevated/60 px-3.5 py-2.5 text-xs">
        <span className="flex items-center gap-1.5 text-docuflow-slate">
          <ShieldCheck className="h-3.5 w-3.5 text-docuflow-cyan" />
          <span>Propietario:</span>
          <strong className="font-mono text-docuflow-navy">
            {project.usuario_correo}
          </strong>
        </span>
        <span className="rounded-full bg-docuflow-input px-2.5 py-0.5 text-[11px] font-semibold text-docuflow-primary">
          {permissions.length} colaborador(es) ACL
        </span>
      </div>

      {statusMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-3.5 py-2.5 text-xs font-semibold text-docuflow-navy">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-3.5 py-2.5 text-xs font-semibold text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleAddPermission} className="grid gap-2.5 sm:grid-cols-6">
        <input
          type="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="colaborador@empresa.com"
          className="rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none sm:col-span-3"
        />
        <select
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value as FolderAccessRole)}
          className="rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none sm:col-span-2"
        >
          {FOLDER_ACCESS_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-docuflow-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-docuflow-action disabled:opacity-60 sm:col-span-1"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Asignar</span>
        </button>
      </form>

      <div className="divide-y divide-docuflow-border rounded-xl border border-docuflow-border bg-docuflow-bg/60">
        {permissions.length === 0 ? (
          <p className="p-4 text-center text-xs text-docuflow-slate">
            Esta carpeta aún no tiene colaboradores asignados por ACL.
          </p>
        ) : (
          permissions.map((perm) => (
            <div
              key={perm.email}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-mono font-semibold text-docuflow-navy">
                  {perm.email}
                </p>
                <p className="text-[11px] text-docuflow-slate">
                  Asignado: {new Date(perm.assigned_at).toLocaleDateString('es-MX')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label={`Rol de ${perm.email}`}
                  disabled={isSaving}
                  value={perm.rol_carpeta}
                  onChange={(e) =>
                    void handleRoleChange(
                      perm.email,
                      e.target.value as FolderAccessRole,
                    )
                  }
                  className="rounded-lg border border-docuflow-border bg-docuflow-surface px-2.5 py-1 text-[11px] font-semibold text-docuflow-navy focus:border-docuflow-action focus:outline-none"
                >
                  {FOLDER_ACCESS_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleRevoke(perm.email)}
                  className="inline-flex items-center gap-1 rounded-lg border border-docuflow-border bg-docuflow-surface px-2.5 py-1 text-[11px] font-semibold text-docuflow-slate hover:border-docuflow-orange hover:text-docuflow-orange disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Revocar</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface FolderAccessModalProps {
  open: boolean;
  project: ProjectRecord | null;
  userPlan: PlanName;
  onClose: () => void;
  onProjectUpdated: (updated: ProjectRecord) => void;
}

export function FolderAccessModal({
  open,
  project,
  userPlan,
  onClose,
  onProjectUpdated,
}: FolderAccessModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && project ? (
        <motion.div
          key="folder-acl-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <motion.div
            key="folder-acl-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="folder-acl-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-xl rounded-2xl border border-docuflow-border bg-docuflow-surface p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-docuflow-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-md bg-docuflow-primary px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                  {project.codigo_proyecto}
                </span>
                <h2
                  id="folder-acl-title"
                  className="mt-2 flex items-center gap-2 font-display text-lg font-bold text-docuflow-navy"
                >
                  <Users className="h-5 w-5 text-docuflow-cyan" />
                  <span>Gestionar Accesos de Carpeta</span>
                </h2>
                <p className="text-xs text-docuflow-slate">
                  {project.nombre_proyecto}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar gestión de accesos"
                className="rounded-lg p-1.5 text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <FolderAccessPanel
              project={project}
              userPlan={userPlan}
              onProjectUpdated={onProjectUpdated}
            />

            <div className="mt-5 flex justify-end border-t border-docuflow-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-docuflow-border bg-docuflow-elevated px-4 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
