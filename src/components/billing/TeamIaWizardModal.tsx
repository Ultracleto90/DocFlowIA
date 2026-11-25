'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Plus,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { USER_ROLES, type UserRole } from '@/core/constants/plans';
import { createPlanRequestSchema } from '@/core/schemas';
import type {
  PlanRequestInitialMember,
  PlanRequestRecord,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { billingPetitions } from '@/services/client/petitions';

interface TeamIaWizardModalProps {
  open: boolean;
  defaultEmail: string;
  onClose: () => void;
  onCreated: (request: PlanRequestRecord, message: string) => void;
}

const GIT_PROVIDERS = [
  'GitHub Cloud',
  'GitLab Cloud',
  'Bitbucket Cloud',
  'Sin integración por ahora',
] as const;

export function TeamIaWizardModal({
  open,
  defaultEmail,
  onClose,
  onCreated,
}: TeamIaWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [organizacion, setOrganizacion] = useState('');
  const [correoCorporativo, setCorreoCorporativo] = useState(defaultEmail);
  const [numUsuarios, setNumUsuarios] = useState(4);

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<UserRole>('Desarrollador');
  const [members, setMembers] = useState<PlanRequestInitialMember[]>([]);

  const [integracionGit, setIntegracionGit] = useState<string>('GitHub Cloud');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrorMessage(null);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onClose]);

  function handleNextFromStep1() {
    setErrorMessage(null);
    if (organizacion.trim().length < 2) {
      setErrorMessage('Ingresa el nombre del Workspace o Agencia.');
      return;
    }
    if (!correoCorporativo.includes('@')) {
      setErrorMessage('Ingresa un correo corporativo válido.');
      return;
    }
    if (numUsuarios < 1 || numUsuarios > 6) {
      setErrorMessage('Team IA incluye hasta 6 usuarios (1 titular + 5 invitados).');
      return;
    }
    setStep(2);
  }

  function handleAddMember() {
    setErrorMessage(null);
    const normalized = memberEmail.toLowerCase().trim();
    if (!normalized || !normalized.includes('@')) {
      setErrorMessage('Escribe un correo válido para el invitado.');
      return;
    }
    if (members.length >= 5) {
      setErrorMessage('El plan Team IA permite hasta 5 invitados iniciales.');
      return;
    }
    if (members.some((m) => m.correo === normalized)) {
      setErrorMessage('Ese correo ya está en la lista de invitados.');
      return;
    }
    setMembers((prev) => [...prev, { correo: normalized, rol: memberRole }]);
    setMemberEmail('');
  }

  function handleRemoveMember(correo: string) {
    setMembers((prev) => prev.filter((m) => m.correo !== correo));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createPlanRequestSchema.safeParse({
      plan_solicitado: 'Team IA',
      organizacion,
      industria: 'Agencia / Squad Ingeniería',
      correo_corporativo: correoCorporativo,
      num_usuarios: numUsuarios,
      personalizaciones: ['RBAC hasta 6 usuarios', 'Manual de Usuario + IEEE 830'],
      integracion_git: integracionGit,
      miembros_iniciales: members.length > 0 ? members : undefined,
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? 'Revisa los datos del onboarding.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await billingPetitions.createPlanRequest(parsed.data);
      onCreated(response.request, response.message);
      setStep(1);
      setOrganizacion('');
      setMembers([]);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo registrar la solicitud Team IA.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="team-wizard-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <motion.div
            key="team-wizard-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-wizard-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full max-w-lg rounded-2xl border border-docuflow-border bg-docuflow-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-docuflow-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-violet/15 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-violet">
                  Team IA | $999 MXN / mes
                </span>
                <h2
                  id="team-wizard-title"
                  className="mt-2 font-display text-lg font-bold text-docuflow-navy"
                >
                  Asistente de Onboarding Team IA
                </h2>
                <p className="text-xs text-docuflow-slate">
                  Paso {step} de 3 | Configura tu workspace antes de activar el squad.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Cerrar asistente Team IA"
                className="rounded-lg p-1.5 text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step progress bar */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-colors ${
                    step >= idx ? 'bg-docuflow-violet' : 'bg-docuflow-input'
                  }`}
                />
              ))}
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-3.5 py-2.5 text-xs text-docuflow-navy"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {step === 1 ? (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="team-org"
                      className="block text-xs font-semibold text-docuflow-navy"
                    >
                      Nombre del Workspace o Agencia
                    </label>
                    <input
                      id="team-org"
                      type="text"
                      value={organizacion}
                      onChange={(e) => setOrganizacion(e.target.value)}
                      placeholder="Ej. Estudio Laravel Norte"
                      className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="team-email"
                        className="block text-xs font-semibold text-docuflow-navy"
                      >
                        Correo corporativo
                      </label>
                      <input
                        id="team-email"
                        type="email"
                        value={correoCorporativo}
                        onChange={(e) => setCorreoCorporativo(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="team-seats"
                        className="block text-xs font-semibold text-docuflow-navy"
                      >
                        Lugares iniciales (1 a 6)
                      </label>
                      <input
                        id="team-seats"
                        type="number"
                        min={1}
                        max={6}
                        value={numUsuarios}
                        onChange={(e) => setNumUsuarios(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-navy">
                      <Users className="h-4 w-4 text-docuflow-violet" />
                      <span>Invitación inicial RBAC (hasta 5 miembros)</span>
                    </p>
                    <span className="text-[11px] text-docuflow-slate">
                      {members.length} / 5 agregados
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-5">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="qa@agencia.com"
                      className="rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none sm:col-span-3"
                    />
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value as UserRole)}
                      className="rounded-xl border border-transparent bg-docuflow-input px-2.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none sm:col-span-2"
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3 py-1.5 text-xs font-semibold text-docuflow-navy hover:border-docuflow-violet"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar colaborador</span>
                  </button>

                  <div className="max-h-36 divide-y divide-docuflow-border overflow-y-auto rounded-xl border border-docuflow-border bg-docuflow-bg px-3">
                    {members.length === 0 ? (
                      <p className="py-3 text-[11px] text-docuflow-slate">
                        Opcional: puedes agregar colaboradores ahora o más adelante desde Gestión de Equipo.
                      </p>
                    ) : (
                      members.map((m) => (
                        <div
                          key={m.correo}
                          className="flex items-center justify-between py-2 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-docuflow-navy">
                              {m.correo}
                            </span>
                            <span className="ml-2 rounded-full bg-docuflow-input px-2 py-0.5 text-[10px] text-docuflow-slate">
                              {m.rol}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.correo)}
                            className="text-docuflow-slate hover:text-docuflow-orange"
                            aria-label={`Quitar ${m.correo}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-navy">
                    <GitBranch className="h-4 w-4 text-docuflow-violet" />
                    <span>Integración Git principal</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {GIT_PROVIDERS.map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setIntegracionGit(provider)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                          integracionGit === provider
                            ? 'border-docuflow-violet bg-docuflow-violet/15 text-docuflow-navy'
                            : 'border-docuflow-border bg-docuflow-elevated text-docuflow-slate hover:text-docuflow-navy'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-xl border border-docuflow-border bg-docuflow-elevated p-3.5 text-xs">
                    <p className="font-semibold text-docuflow-navy">
                      Resumen del Workspace Team IA
                    </p>
                    <p className="mt-1 text-docuflow-slate">
                      Workspace: <strong className="text-docuflow-navy">{organizacion}</strong>
                    </p>
                    <p className="text-docuflow-slate">
                      Lugares: <strong className="text-docuflow-navy">{numUsuarios}</strong> | Invitados iniciales:{' '}
                      <strong className="text-docuflow-navy">{members.length}</strong>
                    </p>
                    <p className="text-docuflow-slate">
                      Git: <strong className="text-docuflow-navy">{integracionGit}</strong>
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 border-t border-docuflow-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-docuflow-border bg-docuflow-elevated px-3.5 py-2 text-xs font-semibold text-docuflow-slate hover:text-docuflow-navy"
                >
                  Cancelar
                </button>

                <div className="flex items-center gap-2">
                  {step > 1 ? (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                      className="inline-flex items-center gap-1 rounded-xl border border-docuflow-border bg-docuflow-surface px-3.5 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Atrás</span>
                    </button>
                  ) : null}

                  {step === 1 ? (
                    <button
                      type="button"
                      onClick={handleNextFromStep1}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : step === 2 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setStep(3);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <span>Siguiente</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>
                        {isSubmitting ? 'Registrando...' : 'Enviar onboarding Team IA'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
