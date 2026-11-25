'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPlanRequestSchema } from '@/core/schemas';
import type { PlanRequestRecord } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { billingPetitions } from '@/services/client/petitions';

interface EnterpriseConfiguratorModalProps {
  open: boolean;
  defaultEmail: string;
  onClose: () => void;
  onCreated: (request: PlanRequestRecord, message: string) => void;
}

const ENTERPRISE_CUSTOMIZATIONS = [
  'White-Label completo (marca, dominio y PDF/MD corporativo)',
  'SSO / SAML 2.0 (Okta, Azure AD, Google Workspace)',
  'Plantillas CMMI / ISO 9001 / OWASP personalizadas',
  'Retención de datos y auditoría personalizada',
  'API Key REST dedicada y soporte SLA',
] as const;

const INDUSTRIES = [
  'FinTech / Banca',
  'Consultora TI / Software Factory',
  'SaaS / Producto Digital',
  'Gobierno / Educación',
  'Salud / Seguros',
  'Retail / Manufactura',
  'Otra',
] as const;

export function EnterpriseConfiguratorModal({
  open,
  defaultEmail,
  onClose,
  onCreated,
}: EnterpriseConfiguratorModalProps) {
  const [organizacion, setOrganizacion] = useState('');
  const [industria, setIndustria] = useState<string>(INDUSTRIES[1]);
  const [correoCorporativo, setCorreoCorporativo] = useState(defaultEmail);
  const [numUsuarios, setNumUsuarios] = useState(25);
  const [integracionGit, setIntegracionGit] = useState('GitHub Enterprise');
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    string[]
  >([
    ENTERPRISE_CUSTOMIZATIONS[0],
    ENTERPRISE_CUSTOMIZATIONS[2],
  ]);
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

  function toggleCustomization(item: string) {
    setSelectedCustomizations((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createPlanRequestSchema.safeParse({
      plan_solicitado: 'Enterprise',
      organizacion,
      industria,
      correo_corporativo: correoCorporativo,
      num_usuarios: numUsuarios,
      personalizaciones: selectedCustomizations,
      integracion_git: integracionGit,
    });

    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ??
          'Revisa los campos de tu configuración Enterprise.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await billingPetitions.createPlanRequest(parsed.data);
      onCreated(response.request, response.message);
      setOrganizacion('');
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo registrar la solicitud Enterprise.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="enterprise-config-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <motion.div
            key="enterprise-config-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="enterprise-config-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-docuflow-border bg-docuflow-surface p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-docuflow-border pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-cyan">
                  Enterprise | Plan a medida
                </span>
                <h2
                  id="enterprise-config-title"
                  className="mt-2 flex items-center gap-2 font-display text-lg font-bold text-docuflow-navy"
                >
                  <Building2 className="h-5 w-5 text-docuflow-cyan" />
                  <span>Configurador de Despliegue Enterprise</span>
                </h2>
                <p className="mt-0.5 text-xs text-docuflow-slate">
                  Define el tamaño de tu organización y módulos corporativos requeridos.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                aria-label="Cerrar configurador Enterprise"
                className="rounded-lg p-1.5 text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy"
              >
                <X className="h-4 w-4" />
              </button>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ent-org"
                    className="block text-xs font-semibold text-docuflow-navy"
                  >
                    Nombre de la organización
                  </label>
                  <input
                    id="ent-org"
                    type="text"
                    value={organizacion}
                    onChange={(e) => setOrganizacion(e.target.value)}
                    placeholder="Ej. Grupo Financiero Altus"
                    className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ent-industry"
                    className="block text-xs font-semibold text-docuflow-navy"
                  >
                    Industria
                  </label>
                  <select
                    id="ent-industry"
                    value={industria}
                    onChange={(e) => setIndustria(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="ent-email"
                    className="block text-xs font-semibold text-docuflow-navy"
                  >
                    Correo de contacto corporativo
                  </label>
                  <input
                    id="ent-email"
                    type="email"
                    value={correoCorporativo}
                    onChange={(e) => setCorreoCorporativo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ent-users"
                    className="block text-xs font-semibold text-docuflow-navy"
                  >
                    Usuarios estimados
                  </label>
                  <input
                    id="ent-users"
                    type="number"
                    min={1}
                    max={10000}
                    value={numUsuarios}
                    onChange={(e) => setNumUsuarios(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ent-git"
                  className="block text-xs font-semibold text-docuflow-navy"
                >
                  Ecosistema Git / CI-CD
                </label>
                <input
                  id="ent-git"
                  type="text"
                  value={integracionGit}
                  onChange={(e) => setIntegracionGit(e.target.value)}
                  placeholder="GitHub Enterprise, GitLab Self-Hosted, Jenkins..."
                  className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                />
              </div>

              <div className="space-y-2 rounded-xl border border-docuflow-border bg-docuflow-bg p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-docuflow-navy">
                  <ShieldCheck className="h-4 w-4 text-docuflow-cyan" />
                  <span>Personalizaciones solicitadas</span>
                </p>
                <div className="space-y-2">
                  {ENTERPRISE_CUSTOMIZATIONS.map((item) => {
                    const checked = selectedCustomizations.includes(item);
                    return (
                      <label
                        key={item}
                        className="flex cursor-pointer items-center gap-2.5 text-xs text-docuflow-navy"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCustomization(item)}
                          className="h-4 w-4 rounded border-docuflow-border text-docuflow-primary"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-docuflow-border pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl border border-docuflow-border bg-docuflow-elevated px-4 py-2 text-xs font-semibold text-docuflow-slate hover:text-docuflow-navy"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-cyan px-4 py-2 text-xs font-bold text-slate-950 transition-all hover:opacity-95 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {isSubmitting
                      ? 'Enviando configuración...'
                      : 'Enviar solicitud Enterprise'}
                  </span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
