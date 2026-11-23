'use client';

import Link from 'next/link';

export function FreemiumAdBanner() {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-orange/40 bg-docuflow-surface p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-docuflow-orange/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-docuflow-orange">
          Sponsored Dev
        </span>
        <div>
          <p className="text-sm font-semibold text-docuflow-navy">
            Plan Freemium Explorer activo — Límite de 2 proyectos/mes y solo Historias INVEST
          </p>
          <p className="mt-0.5 text-xs text-docuflow-slate">
            Desbloquea IEEE 830, Manual de Usuario ISO 26514, exportación PDF limpia y cero esperas de 15s con Pro ($399 MXN/mes).
          </p>
        </div>
      </div>

      <Link
        href="/billing"
        className="shrink-0 rounded-xl bg-docuflow-violet px-4 py-2 text-center text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Actualizar a Pro
      </Link>
    </div>
  );
}
