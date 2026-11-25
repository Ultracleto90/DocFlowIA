'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, CheckCircle2, EyeOff, FileCode2, Filter, LayoutDashboard, RotateCcw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

interface LandingHeroProps {
  isAuthenticated?: boolean;
}

export function LandingHero({ isAuthenticated = false }: LandingHeroProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [previewState, setPreviewState] = useState<'borrador_ia' | 'validado_humano'>(
    'borrador_ia',
  );

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const leftY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, 32],
  );
  const rightY = useTransform(
    scrollYProgress,
    [0, 1],
    shouldReduceMotion ? [0, 0] : [0, -24],
  );

  const isValidated = previewState === 'validado_humano';

  return (
    <section
      ref={heroRef}
      className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-20"
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: Paradigm Shift Copy */}
        <motion.div style={{ y: leftY }} className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-docuflow-border/80 bg-docuflow-surface/85 px-3.5 py-1.5 text-xs font-semibold text-docuflow-primary backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Human-in-the-loop para proyectos Laravel Blade</span>
          </div>

          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-docuflow-navy sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
            Deja de redactar manuales Laravel desde cero. Pasa a ser el Revisor.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-docuflow-slate sm:text-lg">
            Sube el archivo <code className="rounded bg-docuflow-elevated px-1.5 py-0.5 font-mono text-sm text-docuflow-cyan">.zip</code> de tu proyecto Laravel. Nuestro filtro SVM separa las vistas funcionales del ruido visual y genera los borradores normativos para que tú valides, ajustes y apruebes en minutos.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-docuflow-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-docuflow-action active:scale-[0.98]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Ir al Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-docuflow-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-docuflow-action active:scale-[0.98]"
                >
                  <span>Comenzar como Revisor</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-docuflow-border bg-docuflow-surface/90 px-6 py-3.5 text-sm font-semibold text-docuflow-navy transition-all hover:bg-docuflow-elevated active:scale-[0.98]"
                >
                  <span>Iniciar sesión</span>
                </Link>
              </>
            )}
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-docuflow-border/70 pt-6 text-xs">
            <div>
              <dt className="text-docuflow-slate">Normas por paquete</dt>
              <dd className="mt-1 font-display text-sm font-bold text-docuflow-navy">
                INVEST, IEEE 830, ISO 26514
              </dd>
            </div>
            <div>
              <dt className="text-docuflow-slate">Clasificación previa</dt>
              <dd className="mt-1 font-display text-sm font-bold text-docuflow-cyan">
                Filtro SVM (.blade.php)
              </dd>
            </div>
            <div>
              <dt className="text-docuflow-slate">Control final</dt>
              <dd className="mt-1 font-display text-sm font-bold text-docuflow-navy">
                Firma validado_humano
              </dd>
            </div>
          </dl>
        </motion.div>

        {/* Right: Dimensional Live Reviewer Surface */}
        <motion.div style={{ y: rightY }} className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-surface/95 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-docuflow-border bg-docuflow-elevated px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-docuflow-orange" />
                <span className="h-2.5 w-2.5 rounded-full bg-docuflow-cyan" />
                <span className="font-mono text-[11px] font-semibold text-docuflow-navy">
                  Mesa del Revisor (PRJ-001)
                </span>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                  isValidated
                    ? 'bg-docuflow-cyan/20 text-docuflow-cyan'
                    : 'bg-docuflow-orange/20 text-docuflow-orange'
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>{previewState}</span>
              </span>
            </div>

            <div className="space-y-4 p-5">
              {/* SVM Filter Result Row */}
              <div className="rounded-xl border border-docuflow-border/80 bg-docuflow-elevated/70 p-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-docuflow-navy">
                    <FileCode2 className="h-3.5 w-3.5 text-docuflow-cyan" />
                    <span>auth/login.blade.php</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-docuflow-cyan">
                    <Filter className="h-3 w-3" />
                    <span>Código Relevante</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-docuflow-slate">
                  <span className="rounded bg-docuflow-surface px-2 py-0.5">
                    POST /login
                  </span>
                  <span className="rounded bg-docuflow-surface px-2 py-0.5">
                    @csrf
                  </span>
                  <span className="rounded bg-docuflow-surface px-2 py-0.5">
                    input_email
                  </span>
                </div>
              </div>

              {/* Discarded Noise Row */}
              <div className="flex items-center justify-between rounded-xl border border-docuflow-border/60 bg-docuflow-surface px-3.5 py-2.5 text-xs opacity-75">
                <span className="inline-flex items-center gap-1.5 font-mono text-docuflow-slate">
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>layouts/footer.blade.php</span>
                </span>
                <span className="text-[11px] font-medium text-docuflow-slate">
                  Ruido Visual omitido
                </span>
              </div>

              {/* Draft Review Snippet */}
              <div className="rounded-xl border border-docuflow-border bg-docuflow-bg/60 p-4 text-xs leading-relaxed">
                <p className="font-mono text-[11px] font-semibold text-docuflow-primary">
                  Manual Técnico (IEEE 830)
                </p>
                <p className="mt-1.5 text-docuflow-navy">
                  El módulo de acceso procesa credenciales en{' '}
                  <code className="rounded bg-docuflow-surface px-1 font-mono text-docuflow-cyan">
                    /login
                  </code>{' '}
                  con protección CSRF activa y validación de sesión HttpOnly.
                </p>
              </div>

              {/* Interactive Reviewer Decision */}
              <div className="flex items-center justify-between gap-2 border-t border-docuflow-border/70 pt-3">
                <span className="text-[11px] font-medium text-docuflow-slate">
                  Prueba el rol de Revisor:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewState((prev) =>
                      prev === 'borrador_ia' ? 'validado_humano' : 'borrador_ia',
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                    isValidated
                      ? 'border border-docuflow-cyan bg-docuflow-cyan/15 text-docuflow-navy'
                      : 'bg-docuflow-cyan text-slate-950 hover:opacity-90'
                  }`}
                >
                  {isValidated ? (
                    <RotateCcw className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isValidated ? 'Reabrir borrador' : 'Validar documento'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
