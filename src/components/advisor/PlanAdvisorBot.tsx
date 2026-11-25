'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { scheduleDemoSchema } from '@/core/schemas';
import type { AdvisorRecommendedPlan, DemoAppointmentRecord } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { advisorPetitions } from '@/services/client/petitions';

interface PlanAdvisorBotProps {
  defaultName?: string;
  defaultEmail?: string;
  context?: 'landing' | 'billing';
}

type BotTab = 'advisor' | 'faq' | 'schedule';
type TeamSizeChoice = '1-5' | '6-15' | '16+';
type VolumeChoice = 'low' | 'medium' | 'high';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const ADVISOR_FAQS: readonly FaqItem[] = [
  {
    id: 'diff',
    question: '¿Cuándo conviene Team IA vs Enterprise?',
    answer:
      'Team IA ($999 MXN/mes) es ideal para squads o agencias de hasta 6 personas que buscan RBAC, Manuales de Usuario, IEEE 830 e integración Git. Enterprise se cotiza a medida cuando necesitas miembros ilimitados, White-Label, SSO/SAML o auditorías OWASP/CMMI.',
  },
  {
    id: 'svm',
    question: '¿Cómo funciona el filtro SVM antes de la IA?',
    answer:
      'El clasificador analiza las vistas .blade.php y descarta bloques decorativos (navbars, badges, CSS) antes de redactar con Phi-3 Mini, reduciendo ruido visual y consumo de tokens.',
  },
  {
    id: 'zip',
    question: '¿Es seguro subir mi proyecto Laravel en .zip?',
    answer:
      'Sí. Validamos estructura contra Zip Slip, procesamos las vistas dentro del contenedor aislado y registramos cada acceso en logs_auditoria bajo mínimo privilegio en MongoDB.',
  },
  {
    id: 'onboarding',
    question: '¿Cuánto tarda habilitar Enterprise o Team IA?',
    answer:
      'Team IA inicia inmediatamente con nuestro asistente de 3 pasos. Para Enterprise agendamos una sesión de arquitectura y entregamos tu workspace configurado en menos de 48 horas.',
  },
];

export function PlanAdvisorBot({
  defaultName = '',
  defaultEmail = '',
  context = 'landing',
}: PlanAdvisorBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<BotTab>('advisor');
  const [selectedFaqId, setSelectedFaqId] = useState<string>(ADVISOR_FAQS[0].id);

  // Advisor questionnaire state
  const [teamSize, setTeamSize] = useState<TeamSizeChoice | null>(null);
  const [needsWhiteLabelOrSso, setNeedsWhiteLabelOrSso] = useState<boolean | null>(
    null,
  );
  const [monthlyVolume, setMonthlyVolume] = useState<VolumeChoice | null>(null);
  const [needsCompliance, setNeedsCompliance] = useState<boolean | null>(null);

  // Demo scheduling form state
  const [nombre, setNombre] = useState(defaultName);
  const [correo, setCorreo] = useState(defaultEmail);
  const [organizacion, setOrganizacion] = useState('');
  const [planRecomendado, setPlanRecomendado] =
    useState<AdvisorRecommendedPlan>('Team IA');
  const [tamanoEquipo, setTamanoEquipo] = useState('2 a 6 personas');
  const [fechaPreferida, setFechaPreferida] = useState('');
  const [notas, setNotas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedAppointment, setSavedAppointment] =
    useState<DemoAppointmentRecord | null>(null);

  useEffect(() => {
    if (defaultName && !nombre) setNombre(defaultName);
    if (defaultEmail && !correo) setCorreo(defaultEmail);
  }, [defaultName, defaultEmail, nombre, correo]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const isQuestionnaireComplete =
    teamSize !== null &&
    needsWhiteLabelOrSso !== null &&
    monthlyVolume !== null &&
    needsCompliance !== null;

  const recommendation = useMemo(() => {
    if (!isQuestionnaireComplete) return null;

    const reasons: string[] = [];
    let scoreEnterprise = 0;

    if (teamSize === '16+') {
      scoreEnterprise += 2;
      reasons.push('Tu equipo supera los 6 lugares incluidos de Team IA.');
    } else if (teamSize === '6-15') {
      scoreEnterprise += 1;
      reasons.push('Equipo mediano con proyección de crecimiento RBAC.');
    } else {
      reasons.push('Tamaño ideal para iniciar con 1 titular + 5 invitados RBAC.');
    }

    if (needsWhiteLabelOrSso) {
      scoreEnterprise += 2;
      reasons.push('Requieres Marca Blanca (White-Label) o SSO corporativo.');
    }

    if (monthlyVolume === 'high') {
      scoreEnterprise += 2;
      reasons.push('Alto volumen (+30 proyectos/mes) requiere cuota ilimitada.');
    } else if (monthlyVolume === 'medium') {
      reasons.push('Hasta 30 repositorios mensuales cubiertos en Team IA.');
    } else {
      reasons.push('Volumen ligero cubierto cómodamente sin saturar cuota.');
    }

    if (needsCompliance) {
      scoreEnterprise += 2;
      reasons.push('Auditoría OWASP, CMMI Nivel 3 y API Key REST dedicada.');
    } else {
      reasons.push('Manuales de Usuario e IEEE 830 listos para QA en Team IA.');
    }

    const plan: AdvisorRecommendedPlan =
      scoreEnterprise >= 2 ? 'Enterprise' : 'Team IA';
    const suggestedTeamLabel =
      teamSize === '1-5'
        ? '2 a 5 personas'
        : teamSize === '6-15'
          ? '6 a 15 personas'
          : 'Más de 16 personas';

    return {
      plan,
      suggestedTeamLabel,
      reasons,
    };
  }, [
    isQuestionnaireComplete,
    teamSize,
    needsWhiteLabelOrSso,
    monthlyVolume,
    needsCompliance,
  ]);

  function handleResetAdvisor() {
    setTeamSize(null);
    setNeedsWhiteLabelOrSso(null);
    setMonthlyVolume(null);
    setNeedsCompliance(null);
    setSavedAppointment(null);
    setFormError(null);
    setActiveTab('advisor');
  }

  function handleOpenScheduleFromRecommendation() {
    if (recommendation) {
      setPlanRecomendado(recommendation.plan);
      setTamanoEquipo(recommendation.suggestedTeamLabel);
    }
    setSavedAppointment(null);
    setFormError(null);
    setActiveTab('schedule');
  }

  async function handleScheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = scheduleDemoSchema.safeParse({
      nombre,
      correo,
      organizacion,
      plan_recomendado: planRecomendado,
      tamano_equipo: tamanoEquipo,
      fecha_preferida: fechaPreferida,
      notas: notas.trim() ? notas.trim() : undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setFormError(firstIssue?.message ?? 'Revisa los datos del formulario.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await advisorPetitions.scheduleDemo(parsed.data);
      setSavedAppointment(response.appointment);
      setNotas('');
    } catch (err: unknown) {
      setFormError(
        err instanceof HttpError
          ? err.message
          : 'No se pudo agendar la demo en este momento.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const activeFaq =
    ADVISOR_FAQS.find((item) => item.id === selectedFaqId) ?? ADVISOR_FAQS[0];

  const configureHref =
    recommendation?.plan === 'Enterprise'
      ? '/billing?plan=enterprise'
      : '/billing?plan=team';

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {isOpen ? (
          <motion.section
            key="advisor-panel"
            aria-label="Asesor Interactivo de Planes DocuFlow AI"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="mb-3 flex max-h-[82vh] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-docuflow-border bg-docuflow-elevated px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-docuflow-cyan/15 text-docuflow-cyan">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-docuflow-navy">
                    Asesor DocuFlow AI
                  </p>
                  <p className="text-[11px] text-docuflow-slate">
                    {context === 'billing'
                      ? 'Recomendador Team IA & Enterprise'
                      : 'Guía de planes y demos en vivo'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetAdvisor}
                  title="Reiniciar asesor"
                  aria-label="Reiniciar asesor"
                  className="rounded-lg p-1.5 text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar asesor"
                  className="rounded-lg p-1.5 text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 border-b border-docuflow-border bg-docuflow-bg p-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('advisor')}
                className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                  activeTab === 'advisor'
                    ? 'bg-docuflow-surface text-docuflow-primary shadow-sm'
                    : 'text-docuflow-slate hover:text-docuflow-navy'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Asesor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('faq')}
                className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                  activeTab === 'faq'
                    ? 'bg-docuflow-surface text-docuflow-primary shadow-sm'
                    : 'text-docuflow-slate hover:text-docuflow-navy'
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                <span>Preguntas</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
                  activeTab === 'schedule'
                    ? 'bg-docuflow-surface text-docuflow-primary shadow-sm'
                    : 'text-docuflow-slate hover:text-docuflow-navy'
                }`}
              >
                <Calendar className="h-3 w-3" />
                <span>Agendar Demo</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
              {activeTab === 'advisor' ? (
                <div className="space-y-4">
                  <p className="text-docuflow-slate">
                    Responde 4 preguntas rápidas para determinar si tu organización encaja mejor con{' '}
                    <strong className="text-docuflow-navy">Team IA</strong> o{' '}
                    <strong className="text-docuflow-navy">Enterprise</strong>.
                  </p>

                  {/* Q1 */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-docuflow-navy">
                      1. ¿Cuántos desarrolladores o revisores usarán DocuFlow?
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: '1-5', label: '1 a 5' },
                          { id: '6-15', label: '6 a 15' },
                          { id: '16+', label: '16 o más' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setTeamSize(opt.id)}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                            teamSize === opt.id
                              ? 'border-docuflow-primary bg-docuflow-primary text-white'
                              : 'border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-docuflow-navy">
                      2. ¿Necesitas Marca Blanca (White-Label) o SSO / SAML?
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { value: false, label: 'No por ahora' },
                          { value: true, label: 'Sí, es requisito' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setNeedsWhiteLabelOrSso(opt.value)}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                            needsWhiteLabelOrSso === opt.value
                              ? 'border-docuflow-primary bg-docuflow-primary text-white'
                              : 'border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-docuflow-navy">
                      3. ¿Cuántos repositorios Laravel documentan al mes?
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'low', label: 'Hasta 10' },
                          { id: 'medium', label: '11 a 30' },
                          { id: 'high', label: 'Más de 30' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setMonthlyVolume(opt.id)}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                            monthlyVolume === opt.id
                              ? 'border-docuflow-primary bg-docuflow-primary text-white'
                              : 'border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-1.5">
                    <p className="font-semibold text-docuflow-navy">
                      4. ¿Exigen reportes OWASP / CMMI o API REST dedicada?
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(
                        [
                          { value: false, label: 'Solo Manual + IEEE 830' },
                          { value: true, label: 'Sí, OWASP / API REST' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setNeedsCompliance(opt.value)}
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition-all ${
                            needsCompliance === opt.value
                              ? 'border-docuflow-primary bg-docuflow-primary text-white'
                              : 'border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary/60'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation Output */}
                  {recommendation ? (
                    <div className="rounded-xl border border-docuflow-cyan/50 bg-docuflow-elevated p-3.5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-docuflow-cyan">
                          Plan recomendado
                        </span>
                        <span className="rounded-full bg-docuflow-violet/15 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-violet">
                          {recommendation.plan}
                        </span>
                      </div>
                      <p className="mt-1 font-display text-sm font-bold text-docuflow-navy">
                        {recommendation.plan === 'Enterprise'
                          ? 'DocuFlow Enterprise (A medida)'
                          : 'DocuFlow Team IA ($999 MXN / mes)'}
                      </p>
                      <ul className="mt-2 space-y-1 text-[11px] text-docuflow-slate">
                        {recommendation.reasons.map((reason) => (
                          <li key={reason} className="flex items-start gap-1.5">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-docuflow-cyan" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleOpenScheduleFromRecommendation}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-docuflow-cyan px-3 py-2 text-[11px] font-bold text-slate-950 transition-all hover:opacity-95"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Agendar demo</span>
                        </button>
                        <Link
                          href={configureHref}
                          onClick={() => setIsOpen(false)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-docuflow-border bg-docuflow-surface px-3 py-2 text-[11px] font-semibold text-docuflow-navy hover:border-docuflow-primary"
                        >
                          <span>Configurar plan</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === 'faq' ? (
                <div className="space-y-3">
                  <p className="text-docuflow-slate">
                    Selecciona una duda clave para ver detalles técnicos y comerciales:
                  </p>
                  <div className="space-y-1.5">
                    {ADVISOR_FAQS.map((item) => {
                      const active = item.id === activeFaq.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedFaqId(item.id)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-[11px] font-semibold transition-all ${
                            active
                              ? 'border-docuflow-primary bg-docuflow-primary/10 text-docuflow-primary'
                              : 'border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary/50'
                          }`}
                        >
                          <span>{item.question}</span>
                          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-xl border border-docuflow-border bg-docuflow-elevated p-3.5">
                    <p className="font-semibold text-docuflow-navy">
                      {activeFaq.question}
                    </p>
                    <p className="mt-1.5 leading-relaxed text-docuflow-slate">
                      {activeFaq.answer}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-docuflow-cyan hover:underline"
                    >
                      <span>¿Quieres verlo con tus vistas Blade? Agenda una demo</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === 'schedule' ? (
                <div className="space-y-3">
                  {savedAppointment ? (
                    <div className="space-y-3 rounded-xl border border-docuflow-cyan/50 bg-docuflow-elevated p-4">
                      <div className="flex items-center gap-2 text-docuflow-cyan">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p className="font-display text-sm font-bold text-docuflow-navy">
                          Demo registrada correctamente
                        </p>
                      </div>
                      <p className="text-docuflow-slate">
                        Guardamos tu cita para el plan{' '}
                        <strong className="text-docuflow-navy">
                          {savedAppointment.plan_recomendado}
                        </strong>{' '}
                        en MongoDB (estado: {savedAppointment.estado}).
                      </p>
                      <div className="space-y-1 rounded-lg bg-docuflow-surface p-2.5 text-[11px] text-docuflow-navy">
                        <p>
                          <strong>Organización:</strong> {savedAppointment.organizacion}
                        </p>
                        <p>
                          <strong>Correo:</strong> {savedAppointment.correo}
                        </p>
                        <p>
                          <strong>Fecha preferida:</strong>{' '}
                          {savedAppointment.fecha_preferida}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSavedAppointment(null)}
                          className="flex-1 rounded-xl border border-docuflow-border bg-docuflow-surface px-3 py-2 text-[11px] font-semibold text-docuflow-navy hover:bg-docuflow-input"
                        >
                          Agendar otra
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="flex-1 rounded-xl bg-docuflow-primary px-3 py-2 text-[11px] font-semibold text-white hover:bg-docuflow-action"
                        >
                          Cerrar panel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleScheduleSubmit} className="space-y-2.5" noValidate>
                      {formError ? (
                        <div
                          role="alert"
                          className="flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-3 py-2 text-[11px] text-docuflow-navy"
                        >
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-docuflow-orange" />
                          <span>{formError}</span>
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="advisor-nombre"
                            className="block text-[11px] font-semibold text-docuflow-slate"
                          >
                            Nombre
                          </label>
                          <input
                            id="advisor-nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Tu nombre"
                            className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="advisor-correo"
                            className="block text-[11px] font-semibold text-docuflow-slate"
                          >
                            Correo corporativo
                          </label>
                          <input
                            id="advisor-correo"
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="tu@empresa.com"
                            className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="advisor-org"
                          className="block text-[11px] font-semibold text-docuflow-slate"
                        >
                          Organización o Agencia
                        </label>
                        <input
                          id="advisor-org"
                          type="text"
                          value={organizacion}
                          onChange={(e) => setOrganizacion(e.target.value)}
                          placeholder="Ej. Ingeniería FinTech MX"
                          className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor="advisor-plan"
                            className="block text-[11px] font-semibold text-docuflow-slate"
                          >
                            Plan de interés
                          </label>
                          <select
                            id="advisor-plan"
                            value={planRecomendado}
                            onChange={(e) =>
                              setPlanRecomendado(
                                e.target.value as AdvisorRecommendedPlan,
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-2.5 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                          >
                            <option value="Team IA">Team IA ($999 MXN)</option>
                            <option value="Enterprise">Enterprise (A medida)</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="advisor-team"
                            className="block text-[11px] font-semibold text-docuflow-slate"
                          >
                            Tamaño de equipo
                          </label>
                          <input
                            id="advisor-team"
                            type="text"
                            value={tamanoEquipo}
                            onChange={(e) => setTamanoEquipo(e.target.value)}
                            placeholder="Ej. 8 personas"
                            className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="advisor-fecha"
                          className="block text-[11px] font-semibold text-docuflow-slate"
                        >
                          Fecha y horario preferido
                        </label>
                        <input
                          id="advisor-fecha"
                          type="datetime-local"
                          value={fechaPreferida}
                          onChange={(e) => setFechaPreferida(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="advisor-notas"
                          className="block text-[11px] font-semibold text-docuflow-slate"
                        >
                          Notas técnicas (opcional)
                        </label>
                        <textarea
                          id="advisor-notas"
                          rows={2}
                          value={notas}
                          onChange={(e) => setNotas(e.target.value)}
                          placeholder="Ej. Necesitamos White-Label, SSO y exportación OWASP."
                          className="mt-1 w-full rounded-xl border border-transparent bg-docuflow-input px-3 py-2 text-xs text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-docuflow-action disabled:opacity-60"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>
                          {isSubmitting ? 'Agendando demo...' : 'Confirmar cita de demo'}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              ) : null}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="ml-auto flex items-center gap-2 rounded-full border border-docuflow-cyan/50 bg-docuflow-surface px-4 py-3 text-xs font-bold text-docuflow-navy shadow-xl transition-all hover:border-docuflow-cyan hover:bg-docuflow-elevated active:scale-[0.97]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-docuflow-cyan text-slate-950">
          {isOpen ? <X className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </span>
        <span>{isOpen ? 'Cerrar asesor' : 'Asesor de Planes'}</span>
      </button>
    </div>
  );
}
