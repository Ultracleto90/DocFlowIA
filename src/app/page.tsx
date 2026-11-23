import {
  ArrowRight,
  Check,
  CheckCircle2,
  Code2,
  Database,
  EyeOff,
  FileArchive,
  FileCode2,
  FileDown,
  Filter,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { PLANS_LIST } from '@/core/constants/plans';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Ingesta .zip Laravel',
    description:
      'Sube tu proyecto comprimido con protección Zip Slip y conteo automático de vistas .blade.php.',
    icon: FileArchive,
    badgeClass: 'bg-docuflow-primary text-white',
    ringClass: 'group-hover:border-docuflow-primary/40',
  },
  {
    step: '02',
    title: 'Filtro SVM Inteligente',
    description:
      'Clasifica cada plantilla en Código Relevante (formularios, tablas, rutas) o Ruido Visual estático.',
    icon: Filter,
    badgeClass: 'bg-docuflow-cyan text-docuflow-navy',
    ringClass: 'group-hover:border-docuflow-cyan/60',
  },
  {
    step: '03',
    title: 'Redacción IA Normativa',
    description:
      'Genera borradores estructurados INVEST, Manual Técnico IEEE 830 y Manual de Usuario ISO 26514.',
    icon: Sparkles,
    badgeClass: 'bg-docuflow-violet text-white',
    ringClass: 'group-hover:border-docuflow-violet/50',
  },
  {
    step: '04',
    title: 'Auditoría Humana y Exportación',
    description:
      'Edita en Split-View Markdown, cambia a validado_humano y exporta entregables limpios en .md o .pdf.',
    icon: ShieldCheck,
    badgeClass: 'bg-docuflow-orange text-white',
    ringClass: 'group-hover:border-docuflow-orange/50',
  },
] as const;

const MOCK_SVM_ROWS = [
  {
    file: 'resources/views/auth/login.blade.php',
    route: '/login',
    relevant: true,
    tags: ['form', '@csrf', 'input_email'],
  },
  {
    file: 'resources/views/productos/index.blade.php',
    route: '/productos',
    relevant: true,
    tags: ['table', '@foreach', 'route()'],
  },
  {
    file: 'resources/views/layouts/footer.blade.php',
    route: 'N/A',
    relevant: false,
    tags: ['div_container', 'copyright'],
  },
] as const;

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-docuflow-bg text-docuflow-navy">
      {/* Subtle SaaS Grid + Radial Gradient Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(0, 194, 224, 0.22), transparent 42%), radial-gradient(circle at 84% 18%, rgba(157, 78, 221, 0.16), transparent 38%), linear-gradient(to right, rgba(35, 71, 141, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(35, 71, 141, 0.06) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 36px 36px, 36px 36px',
        }}
      />

      {/* Sticky Glassmorphic Navbar */}
      <header className="sticky top-0 z-30 border-b border-docuflow-input/90 bg-docuflow-surface/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-docuflow-primary text-white shadow-sm">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold tracking-tight text-docuflow-navy">
                DocuFlow AI
              </span>
              <span className="hidden rounded-full bg-docuflow-input px-2.5 py-0.5 text-[11px] font-semibold text-docuflow-primary sm:inline-block">
                Laravel Blade SaaS
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-xs font-semibold text-docuflow-slate md:flex">
            <a href="#workspace-preview" className="hover:text-docuflow-primary">
              Workspace
            </a>
            <a href="#workflow" className="hover:text-docuflow-primary">
              Flujo SVM + IA
            </a>
            <a href="#pricing" className="hover:text-docuflow-primary">
              Planes
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-docuflow-input bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy transition-colors hover:bg-docuflow-input"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-docuflow-action"
            >
              <span>Comenzar gratis</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero + Interactive Workspace Mockup */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-docuflow-input bg-docuflow-surface px-3.5 py-1.5 text-xs font-semibold text-docuflow-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-docuflow-violet" />
            <span>INVEST | IEEE 830 | ISO 26514 | Human-in-the-loop</span>
          </span>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-docuflow-navy sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
            Documentación técnica automática para tus vistas{' '}
            <span className="bg-gradient-to-r from-docuflow-primary via-docuflow-action to-docuflow-violet bg-clip-text text-transparent">
              Laravel Blade
            </span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-docuflow-slate sm:text-lg">
            Sube un paquete{' '}
            <code className="rounded-md bg-docuflow-surface px-2 py-0.5 text-sm font-semibold text-docuflow-primary shadow-sm">
              .zip
            </code>{' '}
            de Laravel, separa el ruido visual con clasificación SVM y genera especificaciones normativas auditables listas para exportar en{' '}
            <strong className="text-docuflow-navy">.md</strong> y{' '}
            <strong className="text-docuflow-navy">.pdf</strong>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-docuflow-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-docuflow-action"
            >
              <span>Crear cuenta Freemium ($0)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-docuflow-input bg-docuflow-surface px-6 py-3 text-sm font-semibold text-docuflow-navy shadow-sm transition-colors hover:bg-docuflow-input"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>

        {/* Workspace Preview Mockup */}
        <div
          id="workspace-preview"
          className="mt-14 overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-xl"
        >
          {/* Mock Browser / App Topbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-docuflow-input bg-docuflow-navy px-5 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-docuflow-orange" />
                <span className="h-2.5 w-2.5 rounded-full bg-docuflow-cyan" />
                <span className="h-2.5 w-2.5 rounded-full bg-docuflow-violet" />
              </div>
              <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-[11px] text-docuflow-bg">
                PRJ-001 | Sistema Ultracel Laravel 11
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 font-semibold text-docuflow-cyan">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>validado_humano</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-docuflow-violet/25 px-2.5 py-0.5 font-semibold text-white">
                <Sparkles className="h-3 w-3" />
                <span>1,450 tokens</span>
              </span>
            </div>
          </div>

          {/* Mock Workspace Body: SVM Filter + Split-View Markdown */}
          <div className="grid divide-y divide-docuflow-input lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Left: SVM Filter Preview */}
            <div className="p-5 lg:col-span-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-docuflow-cyan" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-docuflow-navy">
                    Filtro SVM (componentes_filtrados)
                  </h2>
                </div>
                <span className="rounded-full bg-docuflow-input px-2.5 py-0.5 text-[11px] font-semibold text-docuflow-primary">
                  2 Relevantes / 1 Ruido
                </span>
              </div>

              <div className="space-y-2.5">
                {MOCK_SVM_ROWS.map((row) => (
                  <div
                    key={row.file}
                    className={`rounded-xl border p-3 ${
                      row.relevant
                        ? 'border-docuflow-cyan/35 bg-docuflow-bg/40'
                        : 'border-docuflow-input bg-docuflow-input/35 opacity-80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-docuflow-navy">
                        <FileCode2 className="h-3.5 w-3.5 text-docuflow-primary" />
                        <span>{row.file}</span>
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          row.relevant
                            ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                            : 'bg-docuflow-input text-docuflow-slate'
                        }`}
                      >
                        {row.relevant ? (
                          <CheckCircle2 className="h-3 w-3 text-docuflow-cyan" />
                        ) : (
                          <EyeOff className="h-3 w-3 text-docuflow-slate" />
                        )}
                        <span>
                          {row.relevant ? 'Código Relevante' : 'Ruido Visual'}
                        </span>
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-docuflow-primary">
                        Ruta: {row.route}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {row.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-docuflow-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-docuflow-slate shadow-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Split-View Markdown Preview */}
            <div className="bg-docuflow-bg/25 p-5 lg:col-span-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-docuflow-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-docuflow-navy">
                    Split-View Markdown (IEEE 830 &amp; INVEST)
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-docuflow-input bg-docuflow-surface px-2 py-1 text-[10px] font-semibold text-docuflow-navy">
                    <FileDown className="h-3 w-3 text-docuflow-primary" />
                    <span>.md</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-docuflow-violet px-2 py-1 text-[10px] font-semibold text-white">
                    <FileDown className="h-3 w-3" />
                    <span>.pdf</span>
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-docuflow-input bg-docuflow-surface p-3.5 font-mono text-[11px] leading-relaxed text-docuflow-slate">
                  <p className="font-bold text-docuflow-primary">
                    # HU-01: Inicio de Sesión
                  </p>
                  <p className="mt-1">
                    - Vista: `auth/login.blade.php`
                  </p>
                  <p>- Ruta: `POST /login`</p>
                  <p className="mt-1.5 text-docuflow-navy">
                    **Criterios:** `@csrf` activo y validación de credenciales.
                  </p>
                </div>

                <div className="rounded-xl border border-docuflow-input bg-docuflow-surface p-3.5 text-xs leading-relaxed text-docuflow-navy">
                  <p className="text-sm font-bold text-docuflow-navy">
                    HU-01: Inicio de Sesión
                  </p>
                  <p className="mt-1 text-[11px] text-docuflow-slate">
                    Vista:{' '}
                    <code className="rounded bg-docuflow-input px-1 text-docuflow-primary">
                      auth/login.blade.php
                    </code>
                  </p>
                  <div className="mt-2 rounded-lg bg-docuflow-cyan/15 px-2.5 py-1.5 text-[11px] font-medium text-docuflow-navy">
                    Criterios verificados con protección @csrf y auditoría QA.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline */}
      <section id="workflow" className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-docuflow-navy sm:text-3xl">
            Flujo automatizado en 4 etapas
          </h2>
          <p className="mt-2 text-sm text-docuflow-slate">
            Desde tu repositorio comprimido hasta entregables normativos validados por tu equipo.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className={`group rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-sm transition-all ${item.ringClass}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${item.badgeClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-bold text-docuflow-slate">
                    Paso {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-docuflow-navy">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-docuflow-slate">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Plans Comparison */}
      <section
        id="pricing"
        className="relative border-t border-docuflow-input bg-docuflow-surface/75 py-16 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-docuflow-navy">
              Planes diseñados para cada etapa de ingeniería
            </h2>
            <p className="mt-2 text-sm text-docuflow-slate">
              Desde exploración gratuita con Phi-3 Mini hasta nubes corporativas White-Label con auditoría OWASP y bitácora QA dedicada.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PLANS_LIST.map((plan) => {
              const isPro = plan.nombre === 'Pro';
              const isTeam = plan.nombre === 'Team IA';
              const isEnterprise = plan.nombre === 'Enterprise';

              return (
                <div
                  key={plan.nombre}
                  className={`relative flex flex-col justify-between rounded-2xl border bg-docuflow-surface p-6 transition-all ${
                    isPro
                      ? 'border-docuflow-primary shadow-lg ring-2 ring-docuflow-primary/20 xl:-translate-y-1'
                      : isTeam
                        ? 'border-docuflow-violet shadow-md ring-2 ring-docuflow-violet/15'
                        : 'border-docuflow-input shadow-sm'
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
                        <span className="rounded-full bg-docuflow-cyan/20 px-2.5 py-0.5 text-[11px] font-bold text-docuflow-navy">
                          White-Label
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 text-xl font-bold text-docuflow-navy">
                      {plan.nombre}
                    </h3>
                    <p className="text-xs text-docuflow-slate">{plan.subtitulo}</p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span
                        className={`text-3xl font-extrabold ${
                          isTeam
                            ? 'text-docuflow-violet'
                            : 'text-docuflow-primary'
                        }`}
                      >
                        ${plan.precio.toLocaleString('es-MX')}
                      </span>
                      <span className="text-xs text-docuflow-slate">MXN/mes</span>
                    </div>

                    <ul className="mt-5 space-y-2.5 border-t border-docuflow-input pt-4 text-xs text-docuflow-navy">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                        <span>{plan.max_proyectos_mes} proyectos / mes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-docuflow-cyan" />
                        <span>
                          Hasta {plan.max_zip_mb} MB y {plan.max_vistas_blade}{' '}
                          vistas <code>.blade.php</code>
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
                          {plan.pdf_habilitado
                            ? 'Exportación .md y .pdf limpios'
                            : 'Exportación .md con firma'}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/register"
                    className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                      isPro
                        ? 'bg-docuflow-primary text-white hover:bg-docuflow-action'
                        : isTeam
                          ? 'bg-docuflow-violet text-white hover:opacity-90'
                          : 'bg-docuflow-input text-docuflow-navy hover:bg-docuflow-primary hover:text-white'
                    }`}
                  >
                    <span>Elegir {plan.nombre}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative border-t border-docuflow-input bg-docuflow-surface py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs text-docuflow-slate sm:flex-row sm:px-8">
          <span className="flex items-center gap-2 font-semibold text-docuflow-navy">
            <ShieldCheck className="h-4 w-4 text-docuflow-primary" />
            <span>
              DocuFlow AI | Plataforma SaaS de Documentación Técnica Laravel
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Database className="h-3.5 w-3.5 text-docuflow-cyan" />
            <span>Dual Pool: worker_ia_service &amp; auditor_qa_docuflow</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
