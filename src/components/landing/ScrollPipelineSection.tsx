'use client';

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion';
import {
  CheckCircle2,
  EyeOff,
  FileArchive,
  FileDown,
  Filter,
  GitBranch,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRef, useState } from 'react';

const STAGES = [
  {
    index: 0,
    step: '01',
    title: 'Ingesta .zip con validación de seguridad',
    description:
      'Subes tu proyecto Laravel comprimido. El adaptador verifica extensión, límites de cuota del plan y bloquea cualquier entrada maliciosa de Zip Slip antes de leer el árbol de archivos.',
    icon: FileArchive,
  },
  {
    index: 1,
    step: '02',
    title: 'Filtro SVM sobre plantillas .blade.php',
    description:
      'Cada vista se analiza buscando formularios, tablas, directivas @csrf y rutas route(). El modelo separa Código Relevante (etiqueta 1) del Ruido Visual de layouts estáticos (etiqueta 0).',
    icon: Filter,
  },
  {
    index: 2,
    step: '03',
    title: 'Redacción IA y topología normativa',
    description:
      'Con el ruido descartado, la IA estructura los borradores exactos de Historias INVEST, Manual Técnico IEEE 830 y Manual de Usuario ISO 26514 trazando cada vista con su ruta.',
    icon: Sparkles,
  },
  {
    index: 3,
    step: '04',
    title: 'Revisión humana y exportación certificada',
    description:
      'En el Split-View Markdown ajustas detalles técnicos, marcas el estado validado_humano (reversible en cualquier momento) y exportas en .md o .pdf limpio.',
    icon: ShieldCheck,
  },
] as const;

export function ScrollPipelineSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeStage, setActiveStage] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 70%', 'end 35%'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const idx = Math.min(3, Math.max(0, Math.floor(latest * 4)));
    setActiveStage(idx);
  });

  return (
    <section
      id="flujo"
      ref={sectionRef}
      className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-8"
    >
      <div className="mb-12 max-w-2xl">
        <h2 className="font-display text-3xl font-bold text-docuflow-navy sm:text-4xl">
          Del archivo .zip al documento validado en 4 etapas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-docuflow-slate sm:text-base">
          Desplázate por el flujo o selecciona una etapa para inspeccionar cómo se transforma cada vista Blade hasta llegar a manos del Revisor.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        {/* Left Scroll Narrative Stages */}
        <div className="space-y-5 lg:col-span-6">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isActive = activeStage === stage.index;
            return (
              <button
                key={stage.step}
                type="button"
                onClick={() => setActiveStage(stage.index)}
                className={`w-full rounded-2xl border p-6 text-left transition-all ${
                  isActive
                    ? 'border-docuflow-cyan/60 bg-docuflow-surface shadow-lg'
                    : 'border-docuflow-border/70 bg-docuflow-surface/50 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive
                        ? 'bg-docuflow-cyan text-slate-950'
                        : 'bg-docuflow-elevated text-docuflow-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-bold text-docuflow-slate">
                    Etapa {stage.step}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-docuflow-navy">
                  {stage.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-docuflow-slate sm:text-sm">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Sticky Live Inspector Stage */}
        <div className="lg:sticky lg:top-24 lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-docuflow-border bg-docuflow-elevated px-5 py-3.5">
              <span className="font-mono text-xs font-bold text-docuflow-navy">
                Inspector del Pipeline | Etapa 0{activeStage + 1}
              </span>
              <div className="flex gap-1.5">
                {STAGES.map((s) => (
                  <span
                    key={s.step}
                    className={`h-1.5 rounded-full transition-all ${
                      s.index === activeStage
                        ? 'w-6 bg-docuflow-cyan'
                        : 'w-2 bg-docuflow-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="min-h-[340px] p-6">
              <AnimatePresence mode="wait">
                {activeStage === 0 ? (
                  <motion.div
                    key="stage-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between rounded-xl border border-docuflow-cyan/40 bg-docuflow-elevated/60 p-4">
                      <div className="flex items-center gap-3">
                        <FileArchive className="h-6 w-6 text-docuflow-cyan" />
                        <div>
                          <p className="font-mono text-sm font-bold text-docuflow-navy">
                            laravel_portal_v2.zip
                          </p>
                          <p className="text-xs text-docuflow-slate">
                            Framework: Laravel 11 | Peso: 4.8 MB
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-cyan/20 px-2.5 py-1 text-xs font-bold text-docuflow-cyan">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Zip Slip OK</span>
                      </span>
                    </div>

                    <div className="rounded-xl border border-docuflow-border bg-docuflow-bg/60 p-4 font-mono text-xs text-docuflow-slate">
                      <p className="text-docuflow-navy">
                        [planGuardService] Cuota mensual verificada
                      </p>
                      <p className="mt-1">
                        [adm-zip] 24 archivos .blade.php indexados
                      </p>
                      <p className="mt-1 text-docuflow-cyan">
                        [estado] pendiente -&gt; filtrando_svm
                      </p>
                    </div>
                  </motion.div>
                ) : activeStage === 1 ? (
                  <motion.div
                    key="stage-1"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between rounded-xl border border-docuflow-cyan/40 bg-docuflow-elevated/70 p-3.5 text-xs">
                      <div>
                        <p className="font-mono font-bold text-docuflow-navy">
                          resources/views/auth/login.blade.php
                        </p>
                        <p className="mt-0.5 text-docuflow-slate">
                          Señales: form, @csrf, input_email, route()
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-cyan/20 px-2.5 py-1 font-bold text-docuflow-cyan">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>SVM = 1</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-docuflow-cyan/40 bg-docuflow-elevated/70 p-3.5 text-xs">
                      <div>
                        <p className="font-mono font-bold text-docuflow-navy">
                          resources/views/ordenes/create.blade.php
                        </p>
                        <p className="mt-0.5 text-docuflow-slate">
                          Señales: form, select, textarea, button_submit
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-cyan/20 px-2.5 py-1 font-bold text-docuflow-cyan">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>SVM = 1</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-docuflow-border bg-docuflow-bg/60 p-3.5 text-xs opacity-75">
                      <div>
                        <p className="font-mono font-semibold text-docuflow-slate">
                          resources/views/layouts/footer.blade.php
                        </p>
                        <p className="mt-0.5 text-docuflow-slate">
                          Señales: div_container, copyright_text
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-input px-2.5 py-1 font-semibold text-docuflow-slate">
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>SVM = 0</span>
                      </span>
                    </div>
                  </motion.div>
                ) : activeStage === 2 ? (
                  <motion.div
                    key="stage-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-docuflow-violet">
                      <GitBranch className="h-4 w-4" />
                      <span>Topología documental generada</span>
                    </div>

                    <div className="grid gap-3">
                      {[
                        {
                          doc: 'Historias de Usuario (INVEST)',
                          tokens: '1,450 tokens',
                          model: 'Phi-3 Mini + Qwen 2.5 Coder',
                        },
                        {
                          doc: 'Manual Técnico (IEEE 830)',
                          tokens: '2,300 tokens',
                          model: 'Inventario de rutas y @csrf',
                        },
                        {
                          doc: 'Manual de Usuario (ISO 26514)',
                          tokens: '980 tokens',
                          model: 'Guía paso a paso por módulo',
                        },
                      ].map((item) => (
                        <div
                          key={item.doc}
                          className="flex items-center justify-between rounded-xl border border-docuflow-border bg-docuflow-elevated/60 px-4 py-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-docuflow-navy">
                              {item.doc}
                            </p>
                            <p className="text-[11px] text-docuflow-slate">
                              {item.model}
                            </p>
                          </div>
                          <span className="rounded-full bg-docuflow-violet/20 px-2.5 py-1 font-mono font-bold text-docuflow-violet">
                            {item.tokens}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stage-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-4 py-3 text-xs">
                      <span className="inline-flex items-center gap-2 font-bold text-docuflow-navy">
                        <ShieldCheck className="h-4 w-4 text-docuflow-cyan" />
                        <span>Dictamen del Revisor: validado_humano</span>
                      </span>
                      <span className="font-mono text-[11px] text-docuflow-slate">
                        logs_auditoria: EXITOSO
                      </span>
                    </div>

                    <div className="rounded-xl border border-docuflow-border bg-docuflow-bg/60 p-4 text-xs text-docuflow-navy">
                      <p className="font-semibold">
                        Entregables listos para distribución o contexto de IA:
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-docuflow-border bg-docuflow-surface px-3 py-1.5 font-semibold">
                          <FileDown className="h-3.5 w-3.5 text-docuflow-primary" />
                          <span>PRJ-004_ieee_830.md</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-docuflow-violet px-3 py-1.5 font-semibold text-white">
                          <FileDown className="h-3.5 w-3.5" />
                          <span>PRJ-004_ieee_830.pdf</span>
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
