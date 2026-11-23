export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 shadow-sm">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-docuflow-input px-3 py-1 text-xs font-semibold text-docuflow-primary">
          <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
          Sprint 0 · Infraestructura Base Activa
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-docuflow-navy">DocuFlow AI</h1>
        <p className="mt-2 text-sm leading-relaxed text-docuflow-slate">
          Plataforma SaaS de documentación técnica automatizada para proyectos Laravel (
          <code className="rounded bg-docuflow-input px-1.5 py-0.5 text-docuflow-primary">
            .blade.php
          </code>
          ) bajo enfoque Human-in-the-loop.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-docuflow-bg/60 p-4">
            <p className="text-xs font-medium text-docuflow-slate">Reverse Proxy</p>
            <p className="mt-1 text-sm font-semibold text-docuflow-navy">Nginx Alpine :80</p>
          </div>
          <div className="rounded-xl bg-docuflow-bg/60 p-4">
            <p className="text-xs font-medium text-docuflow-slate">Aplicación</p>
            <p className="mt-1 text-sm font-semibold text-docuflow-primary">Next.js 15 + TS</p>
          </div>
          <div className="rounded-xl bg-docuflow-bg/60 p-4">
            <p className="text-xs font-medium text-docuflow-slate">Motor Datos</p>
            <p className="mt-1 text-sm font-semibold text-docuflow-violet">MongoDB Dual Pool</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-docuflow-input pt-4 text-xs text-docuflow-slate">
          <span>Healthcheck disponible en /api/health</span>
          <span className="font-semibold text-docuflow-action">Estado: Listo</span>
        </div>
      </section>
    </main>
  );
}
