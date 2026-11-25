'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  FileCheck2,
  Users,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

const SCENARIOS = [
  {
    id: 'audits',
    label: 'Auditorías normativas',
    icon: ClipboardCheck,
    title: 'Auditorías IEEE 830, ISO 26514, WCAG 2.1 y OWASP sin horas muertas',
    description:
      'Cuando un cliente o comité de calidad exige trazabilidad normativa sobre un sistema Laravel existente, DocuFlow AI inventaria las vistas reales del .zip y redacta la base técnica lista para dictamen.',
    example:
      'Ejemplo: En un módulo de facturación con 45 vistas Blade, el Revisor valida criterios INVEST y alertas de formularios sin @csrf en una sola sesión.',
  },
  {
    id: 'deliveries',
    label: 'Entregas Laravel',
    icon: FileCheck2,
    title: 'Cierre formal de sprints en agencias y fábricas de software',
    description:
      'Evita retrasar la entrega de un proyecto por documentación incompleta. Exporta Manual Técnico y Manual de Usuario en .pdf limpio o con marca blanca Enterprise.',
    example:
      'Ejemplo: Al cerrar un portal e-commerce en Laravel 11, el equipo adjunta el PDF corporativo validado junto al paquete fuente.',
  },
  {
    id: 'onboarding',
    label: 'Onboarding técnico',
    icon: Users,
    title: 'Mapa claro de rutas y formularios al heredar monolitos Blade',
    description:
      'Un desarrollador nuevo deja de abrir decenas de partials y layouts vacíos para entender qué pantallas existen. El filtro SVM expone al instante las vistas activas y sus rutas.',
    example:
      'Ejemplo: Un ingeniero recién incorporado identifica en 3 minutos los 18 formularios operativos entre 90 archivos .blade.php.',
  },
  {
    id: 'agents',
    label: 'Contexto para agentes IA',
    icon: Bot,
    title: 'Markdown depurado sin ruido visual para copilotos y flujos RAG',
    description:
      'Pegar plantillas enteras llenas de HTML decorativo desperdicia ventana de contexto. DocuFlow AI produce Markdown limpio centrado solo en la lógica funcional de cada vista.',
    example:
      'Ejemplo: Exportas el .md validado de tu proyecto y lo entregas como contexto exacto a tu agente de código para generar pruebas E2E.',
  },
] as const;

export function LandingNarrativeSection() {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    SCENARIOS[0].id,
  );
  const activeScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) ?? SCENARIOS[0];

  return (
    <section
      id="que-es"
      className="relative z-10 border-t border-docuflow-border/60 bg-docuflow-surface/80 py-20 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* 1. Que es DocuFlow AI */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl font-bold text-docuflow-navy sm:text-4xl">
              Qué es DocuFlow AI y por qué cambia tu rol
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-docuflow-slate sm:text-base">
              Es una plataforma SaaS especializada en proyectos Laravel (<code className="rounded bg-docuflow-elevated px-1.5 py-0.5 font-mono text-xs text-docuflow-cyan">.blade.php</code>) que automatiza la extracción funcional y la redacción normativa bajo control Human-in-the-loop.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-docuflow-slate sm:text-base">
              El ingeniero ya no pierde tardes escribiendo plantillas desde cero: se convierte en <strong className="text-docuflow-navy">Revisor</strong>. La máquina clasifica, redacta y estructura; tú verificas la precisión técnica y firmas la validez del documento.
            </p>
          </div>

          {/* 2. Por que usarlo: Before / After Ledger */}
          <div className="overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-elevated/60 lg:col-span-7">
            <div className="border-b border-docuflow-border px-6 py-4">
              <h3 className="font-display text-base font-bold text-docuflow-navy">
                Por qué usarlo frente a la documentación manual
              </h3>
            </div>

            <div className="grid divide-y divide-docuflow-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="space-y-3 p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-docuflow-orange">
                  <XCircle className="h-4 w-4" />
                  <span>Redacción manual desde cero</span>
                </p>
                <ul className="space-y-2.5 text-xs leading-relaxed text-docuflow-slate">
                  <li>Inspeccionar carpeta por carpeta qué vistas tienen lógica y cuáles son solo footers o wrappers.</li>
                  <li>Copiar capturas y tablas en procesadores de texto sin formato estándar.</li>
                  <li>Documentación desactualizada apenas cambia una ruta o formulario Blade.</li>
                </ul>
              </div>

              <div className="space-y-3 bg-docuflow-surface/80 p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-docuflow-cyan">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Revisión asistida en DocuFlow AI</span>
                </p>
                <ul className="space-y-2.5 text-xs leading-relaxed text-docuflow-navy">
                  <li>El filtro SVM descarta el ruido visual y extrae rutas, formularios y directivas <code className="font-mono text-docuflow-cyan">@csrf</code>.</li>
                  <li>Borradores inmediatos en INVEST, IEEE 830 e ISO 26514 listos en Split-View Markdown.</li>
                  <li>Trazabilidad auditable: cada ajuste y validación queda en bitácora QA solo lectura.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Cuando usarlo: Interactive 4-Scenario Selector */}
        <div className="mt-16 rounded-2xl border border-docuflow-border bg-docuflow-bg/70 p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-4 border-b border-docuflow-border pb-5 lg:flex-row lg:items-end">
            <div>
              <h3 className="font-display text-2xl font-bold text-docuflow-navy">
                Cuándo usar DocuFlow AI
              </h3>
              <p className="mt-1 text-sm text-docuflow-slate">
                Selecciona un escenario real de ingeniería para ver qué resuelve el flujo de Revisión.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                const active = scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setActiveScenarioId(scenario.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                      active
                        ? 'bg-docuflow-primary text-white shadow-sm'
                        : 'border border-docuflow-border bg-docuflow-surface text-docuflow-slate hover:text-docuflow-navy'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{scenario.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeScenario.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-7">
                <h4 className="font-display text-xl font-bold text-docuflow-navy">
                  {activeScenario.title}
                </h4>
                <p className="mt-2.5 text-sm leading-relaxed text-docuflow-slate">
                  {activeScenario.description}
                </p>
              </div>

              <div className="rounded-xl border border-docuflow-cyan/30 bg-docuflow-surface p-5 lg:col-span-5">
                <div className="flex items-center gap-2 text-xs font-bold text-docuflow-cyan">
                  <Code2 className="h-4 w-4" />
                  <span>Caso práctico en producción</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-docuflow-navy">
                  {activeScenario.example}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
