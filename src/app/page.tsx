import { ArrowRight, Check, Database, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PlanAdvisorBot } from '@/components/advisor/PlanAdvisorBot';
import { LandingFaqAccordion } from '@/components/landing/LandingFaqAccordion';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingNarrativeSection } from '@/components/landing/LandingNarrativeSection';
import { NightSkyCanvas } from '@/components/landing/NightSkyCanvas';
import { ScrollPipelineSection } from '@/components/landing/ScrollPipelineSection';
import { StaggerGrid, StaggerItem } from '@/components/motion/MotionPrimitives';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PLANS_LIST } from '@/core/constants/plans';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-docuflow-bg text-docuflow-navy">
      {/* Animated Nocturnal Sky + Topology Canvas */}
      <NightSkyCanvas />

      {/* Sticky Glassmorphic Header */}
      <header className="sticky top-0 z-30 border-b border-docuflow-border/80 bg-docuflow-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <BrandLogo href="/" subtitle="Laravel Blade SaaS" />

          <nav className="hidden items-center gap-6 text-xs font-semibold text-docuflow-slate md:flex">
            <a href="#que-es" className="transition-colors hover:text-docuflow-primary">
              Qué es y Cuándo usarlo
            </a>
            <a href="#flujo" className="transition-colors hover:text-docuflow-primary">
              Flujo SVM
            </a>
            <a href="#planes" className="transition-colors hover:text-docuflow-primary">
              Planes
            </a>
            <a href="#faq" className="transition-colors hover:text-docuflow-primary">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl border border-docuflow-border bg-docuflow-surface px-3.5 py-2 text-xs font-semibold text-docuflow-navy transition-all hover:bg-docuflow-elevated active:scale-[0.98]"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="hidden items-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-docuflow-action active:scale-[0.98] sm:inline-flex"
            >
              <span>Comenzar gratis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* 1. Immersive Nocturnal Hero */}
        <LandingHero />

        {/* 2. Que es, Por que usarlo, Cuando usarlo */}
        <LandingNarrativeSection />

        {/* 3. Scroll-Craft 4-Stage Pipeline */}
        <ScrollPipelineSection />

        {/* 4. 4-Plan Comparison (Enterprise as Custom / Configure) */}
        <section
          id="planes"
          className="relative z-10 border-y border-docuflow-border/70 bg-docuflow-surface/80 py-20 backdrop-blur-sm"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold text-docuflow-navy sm:text-4xl">
                Planes para revisores independientes y equipos de ingeniería
              </h2>
              <p className="mt-3 text-sm text-docuflow-slate sm:text-base">
                Empieza gratis con Freemium o escala a flujos sin anuncios, exportación PDF limpia y configuraciones Enterprise a medida.
              </p>
            </div>

            <StaggerGrid className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {PLANS_LIST.map((plan) => {
                const isPro = plan.nombre === 'Pro';
                const isTeam = plan.nombre === 'Team IA';
                const isEnterprise = plan.nombre === 'Enterprise';

                return (
                  <StaggerItem
                    key={plan.nombre}
                    className={`relative flex flex-col justify-between rounded-2xl border bg-docuflow-surface p-6 transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                      isPro
                        ? 'border-docuflow-primary shadow-lg ring-2 ring-docuflow-primary/25 xl:-translate-y-1'
                        : isTeam
                          ? 'border-docuflow-violet shadow-md ring-2 ring-docuflow-violet/20'
                          : 'border-docuflow-border shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
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

                        {isPro ? (
                          <span className="rounded-full bg-docuflow-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
                            Más Popular
                          </span>
                        ) : isTeam ? (
                          <span className="rounded-full bg-docuflow-violet px-2.5 py-0.5 text-[11px] font-bold text-white">
                            Ideal Equipos
                          </span>
                        ) : isEnterprise ? (
                          <span className="rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-cyan">
                            White-Label
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-3 font-display text-xl font-bold text-docuflow-navy">
                        {plan.nombre}
                      </h3>
                      <p className="text-xs text-docuflow-slate">{plan.subtitulo}</p>

                      {isEnterprise ? (
                        <div className="mt-4">
                          <span className="font-display text-2xl font-bold text-docuflow-navy">
                            A medida
                          </span>
                          <p className="mt-0.5 text-xs text-docuflow-slate">
                            Cotización personalizada por volumen y despliegue
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-baseline gap-1">
                          <span
                            className={`font-display text-3xl font-extrabold ${
                              isTeam
                                ? 'text-docuflow-violet'
                                : 'text-docuflow-primary'
                            }`}
                          >
                            ${plan.precio.toLocaleString('es-MX')}
                          </span>
                          <span className="text-xs text-docuflow-slate">
                            MXN / mes
                          </span>
                        </div>
                      )}

                      <ul className="mt-5 space-y-2.5 border-t border-docuflow-border pt-4 text-xs text-docuflow-navy">
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                          <span>
                            {isEnterprise
                              ? 'Proyectos mensuales ilimitados'
                              : `${plan.max_proyectos_mes} proyectos / mes`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                          <span>
                            Hasta {plan.max_zip_mb} MB y {plan.max_vistas_blade}{' '}
                            vistas <code className="font-mono">.blade.php</code>
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                          <span>{plan.modelo_ia}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                          <span>{plan.entregables.join(', ')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                          <span>
                            {isEnterprise
                              ? 'Exportación .md/.pdf White-Label, OWASP, CMMI y API Key'
                              : plan.pdf_habilitado
                                ? 'Exportación .md y .pdf limpios'
                                : 'Exportación .md con firma'}
                          </span>
                        </li>
                      </ul>
                    </div>

                    <Link
                      href={
                        isEnterprise
                          ? '/billing?plan=enterprise'
                          : isTeam
                            ? '/billing?plan=team'
                            : `/register?plan=${encodeURIComponent(plan.nombre)}`
                      }
                      className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-center text-xs font-semibold transition-all active:scale-[0.98] ${
                        isPro
                          ? 'bg-docuflow-primary text-white hover:bg-docuflow-action'
                          : isTeam
                            ? 'bg-docuflow-violet text-white hover:opacity-90'
                            : isEnterprise
                              ? 'border border-docuflow-cyan/60 bg-docuflow-cyan/15 text-docuflow-navy hover:bg-docuflow-cyan hover:text-slate-950'
                              : 'bg-docuflow-input text-docuflow-navy hover:bg-docuflow-primary hover:text-white'
                      }`}
                    >
                      <span>
                        {isEnterprise
                          ? 'Configurar plan / Hablar con asesor'
                          : `Elegir ${plan.nombre}`}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* 5. Interactive FAQ Accordion */}
        <LandingFaqAccordion />

        {/* 6. Closing CTA Band */}
        <section className="relative z-10 mx-auto max-w-5xl px-4 pb-20 sm:px-8">
          <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface/95 p-8 text-center shadow-xl sm:p-12">
            <h2 className="font-display text-2xl font-bold text-docuflow-navy sm:text-3xl">
              Convierte tu siguiente entrega Laravel en documentación auditada
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-docuflow-slate">
              Crea tu cuenta gratuita en segundos o inicia sesión para subir tu primer paquete .zip y revisar los borradores generados.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-docuflow-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-docuflow-action active:scale-[0.98]"
              >
                <span>Crear cuenta Freemium</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-docuflow-border bg-docuflow-elevated px-6 py-3 text-sm font-semibold text-docuflow-navy transition-all hover:bg-docuflow-input active:scale-[0.98]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-docuflow-border bg-docuflow-surface py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-docuflow-slate sm:flex-row sm:px-8">
          <span className="flex items-center gap-2 font-semibold text-docuflow-navy">
            <ShieldCheck className="h-4 w-4 text-docuflow-cyan" />
            <span>
              DocuFlow AI | Documentación Técnica Laravel bajo enfoque Human-in-the-loop
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Database className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Dual Pool: worker_ia_service &amp; auditor_qa_docuflow</span>
          </span>
        </div>
      </footer>

      <PlanAdvisorBot context="landing" />
    </div>
  );
}
