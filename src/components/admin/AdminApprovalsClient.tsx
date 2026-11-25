'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Crown,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import type {
  AuthUserProfile,
  DemoAppointmentRecord,
  DemoAppointmentState,
  PlanRequestRecord,
  PlanRequestState,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import {
  adminApprovalsPetitions,
  authPetitions,
} from '@/services/client/petitions';

type ApprovalsTab = 'requests' | 'demos';
type RequestFilter = 'ALL' | PlanRequestState;
type DemoFilter = 'ALL' | DemoAppointmentState;

const DEMO_STATUS_OPTIONS: readonly DemoAppointmentState[] = [
  'pendiente',
  'confirmada',
  'completada',
  'cancelada',
];

export function AdminApprovalsClient() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [requests, setRequests] = useState<PlanRequestRecord[]>([]);
  const [demos, setDemos] = useState<DemoAppointmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<ApprovalsTab>('requests');
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('ALL');
  const [demoFilter, setDemoFilter] = useState<DemoFilter>('ALL');
  const [notesByRequest, setNotesByRequest] = useState<Record<string, string>>(
    {},
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadApprovals = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [meRes, approvalsRes] = await Promise.all([
        authPetitions.me(),
        adminApprovalsPetitions.list(),
      ]);
      setUser(meRes.user);
      setRequests(approvalsRes.requests);
      setDemos(approvalsRes.demos);

      const initialNotes: Record<string, string> = {};
      for (const req of approvalsRes.requests) {
        if (req.notas_admin) initialNotes[req.id] = req.notas_admin;
      }
      setNotesByRequest(initialNotes);
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 401) {
        router.push('/login?next=/admin/approvals');
        return;
      }
      if (err instanceof HttpError && err.status === 403) {
        router.push('/dashboard');
        return;
      }
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar la bandeja de aprobaciones y citas.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  async function handleReviewRequest(
    requestId: string,
    estado: 'aprobada' | 'rechazada',
  ) {
    setBusyId(requestId);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await adminApprovalsPetitions.reviewRequest(requestId, {
        estado,
        notas_admin: notesByRequest[requestId] ?? '',
      });
      setRequests((prev) =>
        prev.map((item) => (item.id === requestId ? res.request : item)),
      );
      setStatusMessage(res.message);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo procesar la solicitud de plan.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdateDemoStatus(
    demoId: string,
    estado: DemoAppointmentState,
  ) {
    setBusyId(demoId);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await adminApprovalsPetitions.updateDemo(demoId, { estado });
      setDemos((prev) =>
        prev.map((item) => (item.id === demoId ? res.appointment : item)),
      );
      setStatusMessage(res.message);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo actualizar el estado de la cita.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          Cargando bandeja administrativa de aprobaciones y demos...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-docuflow-orange">
            {errorMessage ?? 'Acceso restringido.'}
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

  const pendingRequestsCount = requests.filter(
    (r) => r.estado === 'pendiente',
  ).length;
  const approvedRequestsCount = requests.filter(
    (r) => r.estado === 'aprobada',
  ).length;
  const pendingDemosCount = demos.filter((d) => d.estado === 'pendiente').length;
  const confirmedDemosCount = demos.filter(
    (d) => d.estado === 'confirmada',
  ).length;

  const filteredRequests =
    requestFilter === 'ALL'
      ? requests
      : requests.filter((r) => r.estado === requestFilter);

  const filteredDemos =
    demoFilter === 'ALL' ? demos : demos.filter((d) => d.estado === demoFilter);

  return (
    <AppShell user={user}>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-xs font-medium text-docuflow-slate"
      >
        <Link href="/dashboard" className="hover:text-docuflow-primary">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-docuflow-navy">
          Aprobaciones y Citas
        </span>
      </nav>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-docuflow-navy">
            <ClipboardCheck className="h-5 w-5 text-docuflow-cyan" />
            <span>Panel de Aprobaciones y Citas Demo</span>
          </h1>
          <p className="mt-1 text-sm text-docuflow-slate">
            Activa suscripciones Team IA / Enterprise, habilita White-Label corporativo y da seguimiento a demos agendadas por el Asesor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/audit"
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy hover:border-docuflow-primary"
          >
            <ShieldAlert className="h-4 w-4 text-docuflow-primary" />
            <span>Ver Bitácora QA</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>
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

      {/* KPI Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-docuflow-slate">
            Solicitudes pendientes
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-docuflow-orange">
            {pendingRequestsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-docuflow-slate">
            Solicitudes aprobadas
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-docuflow-cyan">
            {approvedRequestsCount}
          </p>
        </div>
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-docuflow-slate">
            Demos pendientes
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-docuflow-violet">
            {pendingDemosCount}
          </p>
        </div>
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-docuflow-slate">
            Demos confirmadas
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-docuflow-primary">
            {confirmedDemosCount}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-docuflow-border pb-3">
        {(
          [
            {
              id: 'requests',
              label: `Solicitudes de Planes (${requests.length})`,
              icon: Crown,
            },
            {
              id: 'demos',
              label: `Citas de Demo (${demos.length})`,
              icon: Calendar,
            },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? 'text-white'
                  : 'bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
              }`}
            >
              {isActive ? (
                <motion.span
                  layoutId="adminApprovalsTab"
                  transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-docuflow-primary shadow-sm"
                />
              ) : null}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'requests' ? (
          <motion.section
            key="tab-requests"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'pendiente', 'aprobada', 'rechazada'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRequestFilter(st)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      requestFilter === st
                        ? 'bg-docuflow-cyan text-slate-950'
                        : 'border border-docuflow-border bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
                    }`}
                  >
                    {st === 'ALL' ? 'Todas' : st}
                  </button>
                ),
              )}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-docuflow-border bg-docuflow-surface p-10 text-center text-xs text-docuflow-slate">
                No hay solicitudes de planes para el filtro seleccionado.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => {
                  const isBusy = busyId === req.id;
                  return (
                    <article
                      key={req.id}
                      className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                req.plan_solicitado === 'Enterprise'
                                  ? 'bg-docuflow-cyan/20 text-docuflow-cyan'
                                  : 'bg-docuflow-violet/15 text-docuflow-violet'
                              }`}
                            >
                              {req.plan_solicitado}
                            </span>
                            <h2 className="text-base font-bold text-docuflow-navy">
                              {req.organizacion}
                            </h2>
                          </div>
                          <p className="mt-1 text-xs text-docuflow-slate">
                            Correo corporativo:{' '}
                            <strong className="text-docuflow-navy">
                              {req.correo_corporativo}
                            </strong>{' '}
                            | Usuarios: {req.num_usuarios}
                            {req.industria ? ` | Industria: ${req.industria}` : ''}
                            {req.integracion_git ? ` | Git: ${req.integracion_git}` : ''}
                          </p>
                          <p className="mt-0.5 text-[11px] text-docuflow-slate">
                            Recibida:{' '}
                            {new Date(req.created_at).toLocaleString('es-MX')}
                          </p>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                            req.estado === 'aprobada'
                              ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                              : req.estado === 'rechazada'
                                ? 'bg-docuflow-orange/15 text-docuflow-orange'
                                : 'bg-docuflow-input text-docuflow-slate'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>{req.estado}</span>
                        </span>
                      </div>

                      {req.personalizaciones.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {req.personalizaciones.map((item) => (
                            <span
                              key={item}
                              className="rounded-lg bg-docuflow-elevated px-2.5 py-1 text-[11px] font-medium text-docuflow-navy"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {req.miembros_iniciales &&
                      req.miembros_iniciales.length > 0 ? (
                        <p className="mt-2 text-xs text-docuflow-slate">
                          Miembros iniciales:{' '}
                          {req.miembros_iniciales
                            .map((m) => `${m.correo} (${m.rol})`)
                            .join(', ')}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-col gap-3 border-t border-docuflow-border pt-4 sm:flex-row sm:items-center">
                        <input
                          type="text"
                          value={notesByRequest[req.id] ?? ''}
                          onChange={(e) =>
                            setNotesByRequest((prev) => ({
                              ...prev,
                              [req.id]: e.target.value,
                            }))
                          }
                          placeholder="Notas de resolución administrativa..."
                          className="flex-1 rounded-xl border border-transparent bg-docuflow-input px-3.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                        />

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleReviewRequest(req.id, 'aprobada')
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-cyan px-4 py-2 text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Aprobar y activar plan</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void handleReviewRequest(req.id, 'rechazada')
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-elevated px-3.5 py-2 text-xs font-semibold text-docuflow-slate hover:border-docuflow-orange hover:text-docuflow-orange disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </motion.section>
        ) : (
          <motion.section
            key="tab-demos"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2">
              {(['ALL', ...DEMO_STATUS_OPTIONS] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setDemoFilter(st)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    demoFilter === st
                      ? 'bg-docuflow-cyan text-slate-950'
                      : 'border border-docuflow-border bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
                  }`}
                >
                  {st === 'ALL' ? 'Todas' : st}
                </button>
              ))}
            </div>

            {filteredDemos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-docuflow-border bg-docuflow-surface p-10 text-center text-xs text-docuflow-slate">
                No hay citas de demo registradas para este filtro.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-docuflow-border bg-docuflow-surface shadow-sm">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-docuflow-border bg-docuflow-elevated/60 text-[11px] font-bold uppercase tracking-wide text-docuflow-slate">
                    <tr>
                      <th className="px-5 py-3">Contacto</th>
                      <th className="px-5 py-3">Organización</th>
                      <th className="px-5 py-3">Plan / Equipo</th>
                      <th className="px-5 py-3">Fecha Preferida</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3 text-right">Actualizar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-docuflow-border">
                    {filteredDemos.map((demo) => {
                      const isBusy = busyId === demo.id;
                      return (
                        <tr key={demo.id} className="align-top">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-docuflow-navy">
                              {demo.nombre}
                            </p>
                            <p className="font-mono text-[11px] text-docuflow-slate">
                              {demo.correo}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-docuflow-navy">
                              {demo.organizacion}
                            </p>
                            {demo.notas ? (
                              <p className="mt-0.5 text-[11px] text-docuflow-slate">
                                {demo.notas}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="rounded-full bg-docuflow-violet/15 px-2 py-0.5 text-[11px] font-bold text-docuflow-violet">
                              {demo.plan_recomendado}
                            </span>
                            <p className="mt-1 text-[11px] text-docuflow-slate">
                              {demo.tamano_equipo}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-docuflow-navy">
                            {demo.fecha_preferida}
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                                demo.estado === 'confirmada' ||
                                demo.estado === 'completada'
                                  ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                                  : demo.estado === 'cancelada'
                                    ? 'bg-docuflow-orange/15 text-docuflow-orange'
                                    : 'bg-docuflow-input text-docuflow-slate'
                              }`}
                            >
                              {demo.estado}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <select
                              aria-label={`Estado de cita para ${demo.organizacion}`}
                              disabled={isBusy}
                              value={demo.estado}
                              onChange={(e) =>
                                void handleUpdateDemoStatus(
                                  demo.id,
                                  e.target.value as DemoAppointmentState,
                                )
                              }
                              className="rounded-xl border border-docuflow-border bg-docuflow-elevated px-3 py-1.5 text-xs font-semibold text-docuflow-navy focus:border-docuflow-action focus:outline-none disabled:opacity-50"
                            >
                              {DEMO_STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
