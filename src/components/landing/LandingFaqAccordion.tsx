'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: '¿Qué pasa con el código fuente de mi archivo .zip y cómo protegen contra Zip Slip?',
    a: 'Cada paquete se valida antes de extraer o escribir rutas: verificamos extensión .zip, límite de peso por plan y bloqueamos cualquier entrada con segmentos ".." o rutas absolutas (Zip Slip). Además, la inspección lee únicamente las vistas .blade.php y la configuración de MongoDB separa la operación readWrite de la auditoría solo lectura.',
  },
  {
    q: '¿Cómo funciona exactamente el Filtro SVM sobre las vistas .blade.php?',
    a: 'El clasificador analiza la estructura HTML y directivas Laravel dentro de cada plantilla (<form>, <input>, <table>, @csrf, @method, route(), @foreach) para distinguir Código Relevante (etiqueta 1) de Ruido Visual como footers, cabeceras estáticas o wrappers sin lógica de negocio (etiqueta 0).',
  },
  {
    q: '¿Qué significa que el usuario pasa de documentador a Revisor?',
    a: 'En lugar de redactar manualmente especificaciones desde cero, recibes borradores normativos (INVEST, IEEE 830 e ISO 26514) en estado borrador_ia dentro del Split-View Markdown. Tu trabajo como Revisor es contrastar el texto frente a las rutas detectadas, corregir detalles específicos de negocio y aprobarlo como validado_humano.',
  },
  {
    q: '¿Cómo garantizan la privacidad y trazabilidad en la base de datos?',
    a: 'Cada inicio de sesión, carga de proyecto, edición, validación y exportación queda registrada en logs_auditoria con la IP real del cliente. El panel /admin/audit consulta exclusivamente mediante la cuenta de mínimo privilegio auditor_qa_docuflow (permiso read-only), sin capacidad de alterar registros.',
  },
  {
    q: '¿Cuál es la diferencia clave entre Team IA ($999 MXN) y Enterprise (A medida)?',
    a: 'Team IA cubre agencias y startups con hasta 30 proyectos al mes, 5 colaboradores RBAC, Webhooks GitHub/GitLab y auditoría Blade/WCAG 2.1. Enterprise se configura a medida con marca blanca (White-Label), API Key REST, auditoría OWASP, plantillas CMMI/ISO 9001, usuarios ilimitados y bitácora QA completa.',
  },
  {
    q: '¿Qué formatos puedo exportar y sirven como contexto para otros agentes de IA?',
    a: 'Desde Pro en adelante exportas tanto Markdown (.md) como PDF (.pdf) limpios sin marca de agua (en Freemium solo .md con pie de firma). El Markdown exportado omite el ruido HTML decorativo, por lo que funciona como contexto compacto para copilotos o flujos RAG.',
  },
  {
    q: '¿Puedo revertir un documento validado o cambiar de plan después?',
    a: 'Sí, bajo el Principio de Regresión: en el editor puedes descartar cambios antes de guardar o reabrir cualquier documento validado_humano de vuelta a borrador_ia. También puedes cambiar de plan o cancelar acciones destructivas mediante diálogos de confirmación en cualquier momento.',
  },
] as const;

export function LandingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative z-10 mx-auto max-w-4xl px-4 py-20 sm:px-8"
    >
      <div className="mb-10 text-center">
        <h2 className="font-display text-3xl font-bold text-docuflow-navy">
          Preguntas frecuentes
        </h2>
        <p className="mt-2 text-sm text-docuflow-slate">
          Detalles técnicos sobre seguridad, filtro SVM, privacidad, planes y flujo de revisión.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-docuflow-border bg-docuflow-surface/95 shadow-sm transition-colors"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-display text-sm font-bold text-docuflow-navy sm:text-base">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-docuflow-cyan transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-docuflow-border/60 px-6 py-4 text-xs leading-relaxed text-docuflow-slate sm:text-sm">
                      {item.a}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
