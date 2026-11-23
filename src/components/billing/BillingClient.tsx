'use client';

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Crown,
  KeyRound,
  Lock,
  Palette,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  USER_ROLES,
  type PlanDefinition,
  type PlanName,
  type UserRole,
} from '@/core/constants/plans';
import {
  enterpriseConfigSchema,
  teamInviteSchema,
} from '@/core/schemas';
import type { AuthUserProfile } from '@/core/types';
import { AppShell } from '@/components/layout/AppShell';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions, billingPetitions } from '@/services/client/petitions';

export function BillingClient() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [plans, setPlans] = useState<readonly PlanDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [switchingPlan, setSwitchingPlan] = useState<PlanName | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Revisor QA');
  const [isInviting, setIsInviting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const [wlEnabled, setWlEnabled] = useState(false);
  const [wlBrandName, setWlBrandName] = useState('');
  const [wlLogoUrl, setWlLogoUrl] = useState('');
  const [isSavingEnterprise, setIsSavingEnterprise] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [revealedApiKey, setRevealedApiKey] = useState<string | null>(null);

  const syncEnterpriseFields = useCallback((profile: AuthUserProfile) => {
    setWlEnabled(Boolean(profile.white_label?.enabled));
    setWlBrandName(profile.white_label?.brand_name ?? '');
    setWlLogoUrl(profile.white_label?.logo_url ?? '');
    if (profile.plan.nombre === 'Pro') {
      setInviteRole('Revisor QA');
    }
  }, []);

  const loadBilling = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [meRes, plansRes] = await Promise.all([
        authPetitions.me(),
        billingPetitions.getPlans(),
      ]);
      setUser(meRes.user);
      setPlans(plansRes.plans);
      syncEnterpriseFields(meRes.user);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 401) {
        router.push('/login?next=/billing');
        return;
      }
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar la configuración de planes y facturación.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, syncEnterpriseFields]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  async function handlePlanChange(planName: PlanName) {
    setSwitchingPlan(planName);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await billingPetitions.upgradePlan(planName);
      setUser(res.user);
      syncEnterpriseFields(res.user);
      setStatusMessage(res.message);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError ? err.message : 'No se pudo cambiar el plan.',
      );
    } finally {
      setSwitchingPlan(null);
    }
  }

  async function handleInviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const parsed = teamInviteSchema.safeParse({
      correo: inviteEmail,
      rol: inviteRole,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrorMessage(
        flat.correo?.[0] ?? flat.rol?.[0] ?? 'Datos de invitación inválidos.',
      );
      return;
    }

    setIsInviting(true);
    try {
      const res = await billingPetitions.manageTeam.invite(parsed.data);
      setUser(res.user);
      setInviteEmail('');
      setStatusMessage(
        `Miembro ${parsed.data.correo} (${parsed.data.rol}) agregado al equipo.`,
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo invitar al miembro.',
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember(correo: string) {
    setRemovingEmail(correo);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await billingPetitions.manageTeam.remove(correo);
      setUser(res.user);
      setStatusMessage(`Miembro ${correo} removido del equipo.`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo remover al miembro.',
      );
    } finally {
      setRemovingEmail(null);
    }
  }

  async function handleSaveWhiteLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    const parsed = enterpriseConfigSchema.safeParse({
      white_label: {
        enabled: wlEnabled,
        brand_name: wlBrandName,
        logo_url: wlLogoUrl,
      },
    });
    if (!parsed.success || !parsed.data.white_label) {
      const msg =
        parsed.success
          ? 'Configuración inválida.'
          : parsed.error.issues[0]?.message ?? 'Configuración White-Label inválida.';
      setErrorMessage(msg);
      return;
    }

    setIsSavingEnterprise(true);
    try {
      const res = await billingPetitions.updateWhiteLabel(
        parsed.data.white_label,
      );
      setUser(res.user);
      syncEnterpriseFields(res.user);
      setStatusMessage(
        'Configuración White-Label actualizada en vivo en la plataforma y exportaciones.',
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo actualizar White-Label.',
      );
    } finally {
      setIsSavingEnterprise(false);
    }
  }

  async function handleRotateApiKey() {
    setIsRotatingKey(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await billingPetitions.generateApiKey();
      setUser(res.user);
      if (res.generated_api_key) {
        setRevealedApiKey(res.generated_api_key);
      }
      setStatusMessage('Nueva API Key REST Enterprise generada.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo rotar la API Key.',
      );
    } finally {
      setIsRotatingKey(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          {errorMessage ?? 'Cargando planes y configuración SaaS...'}
        </div>
      </div>
    );
  }

  const teamMembers = user.team_members ?? [];
  const isEnterprise = user.plan.nombre === 'Enterprise';
  const canInvite = user.plan.nombre !== 'Freemium';
  const availableRoles: readonly UserRole[] =
    user.plan.nombre === 'Pro' ? ['Revisor QA'] : USER_ROLES;

  return (
    <AppShell user={user}>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-docuflow-navy">
          <Crown className="h-5 w-5 text-docuflow-violet" />
          <span>Planes, Suscripción, Equipo y Marca Blanca</span>
        </h1>
        <p className="mt-1 text-sm text-docuflow-slate">
          Cambia de nivel en vivo para probar cuotas, desbloqueo de PDF/IEEE 830, eliminación de anuncios, RBAC y White-Label.
        </p>
      </div>

      {statusMessage ? (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-docuflow-cyan/40 bg-docuflow-surface px-5 py-3.5 text-sm font-semibold text-docuflow-navy shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
          <span>{statusMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="mb-5 flex items-center gap-2 rounded-2xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-5 py-3.5 text-sm font-semibold text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* 4 Comparative Plans Grid */}
      <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const isCurrent = user.plan.nombre === plan.nombre;
          const isSwitching = switchingPlan === plan.nombre;

          return (
            <div
              key={plan.nombre}
              className={`flex flex-col justify-between rounded-2xl border p-6 shadow-sm transition-all ${
                isCurrent
                  ? 'border-docuflow-primary bg-docuflow-surface ring-2 ring-docuflow-primary/20'
                  : 'border-docuflow-input bg-docuflow-surface'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      plan.nombre === 'Freemium'
                        ? 'bg-docuflow-orange/15 text-docuflow-orange'
                        : 'bg-docuflow-violet/15 text-docuflow-violet'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{plan.nivel_ia}</span>
                  </span>
                  {isCurrent ? (
                    <span className="rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-navy">
                      Plan Actual
                    </span>
                  ) : null}
                </div>

                <h2 className="mt-3 text-lg font-bold text-docuflow-navy">
                  {plan.nombre}
                </h2>
                <p className="text-xs text-docuflow-slate">{plan.subtitulo}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-docuflow-primary">
                    ${plan.precio.toLocaleString('es-MX')}
                  </span>
                  <span className="text-xs font-medium text-docuflow-slate">
                    MXN / mes
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5 border-t border-docuflow-input pt-4 text-xs text-docuflow-navy">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>{plan.max_proyectos_mes} proyectos / mes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>
                      Máx {plan.max_zip_mb} MB | {plan.max_vistas_blade} vistas{' '}
                      <code>.blade.php</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>IA: {plan.modelo_ia}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>Entregables: {plan.entregables.length} de 3 normas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>
                      Exportación:{' '}
                      {plan.pdf_habilitado
                        ? '.md y .pdf limpios'
                        : 'Solo .md con firma'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                    <span>{plan.extras_resumen}</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                disabled={isCurrent || switchingPlan !== null}
                onClick={() => void handlePlanChange(plan.nombre)}
                className={`mt-6 w-full rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'cursor-default bg-docuflow-input text-docuflow-slate'
                    : 'bg-docuflow-primary text-white hover:bg-docuflow-action disabled:opacity-60'
                }`}
              >
                {isCurrent
                  ? 'Activo actualmente'
                  : isSwitching
                    ? 'Cambiando plan...'
                    : `Cambiar a ${plan.nombre}`}
              </button>
            </div>
          );
        })}
      </section>

      {/* Team Management + Enterprise White-Label */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Management */}
        <section className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
                <Users className="h-4 w-4 text-docuflow-primary" />
                <span>Gestión de Equipo RBAC</span>
              </h3>
              <p className="mt-1 text-xs text-docuflow-slate">
                {user.plan.nombre === 'Freemium'
                  ? 'Plan Freemium: 1 usuario (sin invitados).'
                  : user.plan.nombre === 'Pro'
                    ? 'Plan Pro: 1 titular + 1 invitado solo lectura (Revisor QA).'
                    : user.plan.nombre === 'Team IA'
                      ? 'Plan Team IA: hasta 5 miembros invitados con roles RBAC.'
                      : 'Plan Enterprise: miembros RBAC ilimitados.'}
              </p>
            </div>
            <span className="rounded-full bg-docuflow-input px-3 py-1 text-xs font-bold text-docuflow-primary">
              {teamMembers.length} invitado(s)
            </span>
          </div>

          {canInvite ? (
            <form onSubmit={handleInviteMember} className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                  className="rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none sm:col-span-2"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isInviting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action disabled:opacity-60"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isInviting ? 'Invitando...' : 'Invitar al equipo'}</span>
              </button>
            </form>
          ) : (
            <div className="mt-4 rounded-xl bg-docuflow-orange/10 p-4 text-xs text-docuflow-navy">
              Actualiza a <strong>Pro</strong> o superior para invitar colaboradores.
            </div>
          )}

          <div className="mt-5 divide-y divide-docuflow-input border-t border-docuflow-input">
            {teamMembers.length === 0 ? (
              <p className="py-4 text-xs text-docuflow-slate">
                Sin miembros invitados todavía.
              </p>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.correo}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-docuflow-navy">
                      {member.correo}
                    </p>
                    <p className="text-[11px] text-docuflow-slate">
                      Rol: {member.rol}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveMember(member.correo)}
                    disabled={removingEmail === member.correo}
                    className="inline-flex items-center gap-1 rounded-lg border border-docuflow-input px-2.5 py-1 text-[11px] font-semibold text-docuflow-slate hover:border-docuflow-orange hover:text-docuflow-orange"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>
                      {removingEmail === member.correo ? 'Quitando...' : 'Remover'}
                    </span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Enterprise White-Label & API Key */}
        <section className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
                <Palette className="h-4 w-4 text-docuflow-violet" />
                <span>Marca Blanca (White-Label) &amp; API Key REST</span>
              </h3>
              <p className="mt-1 text-xs text-docuflow-slate">
                Personaliza el Sidebar/Navbar y los encabezados PDF/MD exportados (solo Enterprise).
              </p>
            </div>
            <span className="rounded-full bg-docuflow-violet/15 px-3 py-1 text-[11px] font-bold text-docuflow-violet">
              Enterprise
            </span>
          </div>

          {!isEnterprise ? (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-docuflow-violet/30 bg-docuflow-violet/5 p-5 text-xs text-docuflow-navy">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-violet" />
              <div>
                <p className="font-semibold">
                  Exclusivo de Plan Enterprise ($3,999 MXN/mes)
                </p>
                <p className="mt-1 text-docuflow-slate">
                  Cambia al plan Enterprise arriba para activar White-Label en vivo y generar tu API Key REST.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              <form onSubmit={handleSaveWhiteLabel} className="space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-docuflow-navy">
                  <input
                    type="checkbox"
                    checked={wlEnabled}
                    onChange={(e) => setWlEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-docuflow-input text-docuflow-primary"
                  />
                  Activar White-Label en plataforma y exportaciones
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="wl-brand"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-docuflow-slate"
                    >
                      Nombre de Marca
                    </label>
                    <input
                      id="wl-brand"
                      type="text"
                      value={wlBrandName}
                      onChange={(e) => setWlBrandName(e.target.value)}
                      placeholder="Ej. Acme Engineering Docs"
                      className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wl-logo"
                      className="block text-[11px] font-semibold uppercase tracking-wide text-docuflow-slate"
                    >
                      URL Logo (opcional)
                    </label>
                    <input
                      id="wl-logo"
                      type="url"
                      value={wlLogoUrl}
                      onChange={(e) => setWlLogoUrl(e.target.value)}
                      placeholder="https://empresa.com/logo.png"
                      className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingEnterprise}
                  className="rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white hover:bg-docuflow-action disabled:opacity-60"
                >
                  {isSavingEnterprise
                    ? 'Guardando marca...'
                    : 'Guardar White-Label'}
                </button>
              </form>

              <div className="border-t border-docuflow-input pt-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold text-docuflow-navy">
                      <KeyRound className="h-3.5 w-3.5 text-docuflow-violet" />
                      <span>API Key REST Enterprise</span>
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-docuflow-slate">
                      {revealedApiKey ??
                        (user.api_key
                          ? `${user.api_key.slice(0, 14)}****************`
                          : 'Aún no generada')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRotateApiKey()}
                    disabled={isRotatingKey}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>
                      {isRotatingKey
                        ? 'Generando...'
                        : user.api_key
                          ? 'Rotar API Key'
                          : 'Generar API Key'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
