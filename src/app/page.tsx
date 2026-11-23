import Link from 'next/link';
import { PLANS_LIST } from '@/core/constants/plans';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Ingesta .zip Laravel',
    description:
      'Sube el paquete comprimido de tu proyecto Laravel con protección Zip Slip y conteo automático de vistas .blade.php.',
    accent: 'bg-docuflow-primary text-white',
  },
  {
    step: '02',
    title: 'Filtro SVM Inteligente',
    description:
      'Clasifica automáticamente cada vista en Código Relevante (formularios, tablas, rutas) o Ruido Visual (footers, wrappers estáticos).',
    accent: 'bg-docuflow-cyan text-docuflow-navy',
  },
  {
    step: '03',
    title: 'Redacción IA Normativa',
    description:
      'Genera borradores estructurados de Historias de Usuario (INVEST), Manual Técnico (IEEE 830) y Manual de Usuario (ISO 26514).',
    accent: 'bg-docuflow-violet text-white',
  },
  {
    step: '04',
    title: 'Auditoría Humana y Exportación',
    description:
      'Edita en Split-View Markdown, valida el estado a validado_humano y exporta documentos limpios en .md o .pdf.',
    accent: 'bg-docuflow-orange text-white',
  },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-docuflow-bg text-docuflow-navy">
      {/* Top Navbar */}
      <header className="border-b border-docuflow-input bg-docuflow-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-docuflow-primary text-sm font-bold text-white">
              DF
            </div>
            <div>
              <span className="text-base font-bold text-docuflow-navy">
                DocuFlow AI
              </span>
              <span className="ml-2 hidden rounded-full bg-docuflow-input px-2.5 py-0.5 text-[11px] font-semibold text-docuflow-primary sm:inline-block">
                Laravel Blade · Human-in-the-loop
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-docuflow-input bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy transition-colors hover:bg-docuflow-input"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-docuflow-action"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-docuflow-surface px-3.5 py-1.5 text-xs font-semibold text-docuflow-primary shadow-sm">
            <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
            INVEST · IEEE 830 · ISO 26514 · Auditoría QA
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-docuflow-navy sm:text-5xl">
            Documentación técnica automática para tus vistas{' '}
            <span className="text-docuflow-primary">Laravel Blade</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-docuflow-slate sm:text-lg">
            Transforma archivos <code className="rounded bg-docuflow-surface px-1.5 py-0.5 text-sm font-semibold text-docuflow-primary">.zip</code> con plantillas <code className="rounded bg-docuflow-surface px-1.5 py-0.5 text-sm font-semibold text-docuflow-primary">.blade.php</code> en manuales normativos auditables, separando el ruido visual con SVM y validando cada entregable con enfoque Human-in-the-loop.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-docuflow-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-docuflow-action"
            >
              Crear cuenta Freemium ($0)
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-docuflow-input bg-docuflow-surface px-6 py-3 text-sm font-semibold text-docuflow-navy shadow-sm transition-colors hover:bg-docuflow-input"
            >
              Ya tengo cuenta · Ir al Dashboard
            </Link>
          </div>
        </div>

        {/* 4-Step Pipeline */}
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm"
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${item.accent}`}
              >
                {item.step}
              </span>
              <h2 className="mt-4 text-base font-bold text-docuflow-navy">
                {item.title}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-docuflow-slate">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans Comparison */}
      <section className="border-t border-docuflow-input bg-docuflow-surface/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-docuflow-navy">
              Planes diseñados para cada etapa de ingeniería
            </h2>
            <p className="mt-2 text-sm text-docuflow-slate">
              Desde exploración gratuita con Phi-3 Mini hasta nubes corporativas White-Label con auditoría OWASP y bitácora QA dedicada.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PLANS_LIST.map((plan) => (
              <div
                key={plan.nombre}
                className={`flex flex-col justify-between rounded-2xl border bg-docuflow-surface p-6 shadow-sm ${
                  plan.nombre === 'Pro'
                    ? 'border-docuflow-primary ring-2 ring-docuflow-primary/15'
                    : 'border-docuflow-input'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
                      {plan.nivel_ia}
                    </span>
                    {plan.nombre === 'Pro' ? (
                      <span className="rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-navy">
                        Recomendado
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-xl font-bold text-docuflow-navy">
                    {plan.nombre}
                  </h3>
                  <p className="text-xs text-docuflow-slate">{plan.subtitulo}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-docuflow-primary">
                      ${plan.precio.toLocaleString('es-MX')}
                    </span>
                    <span className="text-xs text-docuflow-slate">MXN/mes</span>
                  </div>

                  <ul className="mt-5 space-y-2 border-t border-docuflow-input pt-4 text-xs text-docuflow-navy">
                    <li>• {plan.max_proyectos_mes} proyectos / mes</li>
                    <li>
                      • Hasta {plan.max_zip_mb} MB y {plan.max_vistas_blade} vistas
                    </li>
                    <li>• {plan.modelo_ia}</li>
                    <li>• {plan.entregables.join(', ')}</li>
                    <li>
                      •{' '}
                      {plan.pdf_habilitado
                        ? 'Exportación .md y .pdf limpios'
                        : 'Exportación .md con firma'}
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className={`mt-6 block w-full rounded-xl px-4 py-2.5 text-center text-xs font-semibold transition-colors ${
                    plan.nombre === 'Pro'
                      ? 'bg-docuflow-primary text-white hover:bg-docuflow-action'
                      : 'bg-docuflow-input text-docuflow-navy hover:bg-docuflow-primary hover:text-white'
                  }`}
                >
                  Elegir {plan.nombre}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-docuflow-input bg-docuflow-surface py-6 text-center text-xs text-docuflow-slate">
        DocuFlow AI · Plataforma SaaS de Documentación Técnica Laravel con Seguridad Dual Pool (worker_ia_service &amp; auditor_qa_docuflow)
      </footer>
    </div>
  );
}
