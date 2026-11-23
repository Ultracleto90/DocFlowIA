'use client';

import { ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function FreemiumAdBanner() {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-orange/40 bg-docuflow-surface p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg bg-docuflow-orange/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-docuflow-orange">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Sponsored Dev</span>
        </span>
        <div>
          <p className="text-sm font-semibold text-docuflow-navy">
            Plan Freemium Explorer activo: límite de 2 proyectos/mes y solo Historias INVEST
          </p>
          <p className="mt-0.5 text-xs text-docuflow-slate">
            Desbloquea IEEE 830, Manual de Usuario ISO 26514, exportación PDF limpia y cero esperas de 15s con Pro ($399 MXN/mes).
          </p>
        </div>
      </div>

      <Link
        href="/billing"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        <span>Actualizar a Pro</span>
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
