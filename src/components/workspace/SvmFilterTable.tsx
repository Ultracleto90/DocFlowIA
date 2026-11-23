'use client';

import {
  CheckCircle2,
  EyeOff,
  FileCode2,
  Filter,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import type { FilteredComponentRecord } from '@/core/types';

interface SvmFilterTableProps {
  components: FilteredComponentRecord[];
}

type FilterMode = 'all' | 'relevant' | 'noise';

export function SvmFilterTable({ components }: SvmFilterTableProps) {
  const [filter, setFilter] = useState<FilterMode>('all');

  const relevantCount = components.filter((c) => c.etiqueta_svm === 1).length;
  const noiseCount = components.filter((c) => c.etiqueta_svm === 0).length;

  const filtered = components.filter((item) => {
    if (filter === 'relevant') return item.etiqueta_svm === 1;
    if (filter === 'noise') return item.etiqueta_svm === 0;
    return true;
  });

  return (
    <section className="overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-docuflow-input px-6 py-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-docuflow-navy">
            <Filter className="h-4 w-4 text-docuflow-cyan" />
            <span>Componentes Filtrados por SVM ({components.length})</span>
          </h2>
          <p className="mt-0.5 text-xs text-docuflow-slate">
            Clasificación binaria de vistas <code className="rounded bg-docuflow-input px-1">.blade.php</code> en Código Relevante (1) vs Ruido Visual (0).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-docuflow-primary text-white'
                : 'bg-docuflow-input text-docuflow-slate hover:text-docuflow-navy'
            }`}
          >
            Todos ({components.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('relevant')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === 'relevant'
                ? 'bg-docuflow-cyan text-docuflow-navy'
                : 'bg-docuflow-input text-docuflow-slate hover:text-docuflow-navy'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Código Relevante ({relevantCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('noise')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              filter === 'noise'
                ? 'bg-docuflow-orange text-white'
                : 'bg-docuflow-input text-docuflow-slate hover:text-docuflow-navy'
            }`}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Ruido Visual ({noiseCount})</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-docuflow-slate">
          No hay vistas Blade registradas para este filtro.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-docuflow-bg/50 text-xs font-semibold uppercase tracking-wide text-docuflow-slate">
              <tr>
                <th className="px-6 py-3">Archivo Blade</th>
                <th className="px-6 py-3">Ruta Web</th>
                <th className="px-6 py-3">Clasificación SVM</th>
                <th className="px-6 py-3">Elementos Detectados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-docuflow-input">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-docuflow-bg/25">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-docuflow-navy">
                    <span className="inline-flex items-center gap-1.5">
                      <FileCode2 className="h-3.5 w-3.5 text-docuflow-primary" />
                      <span>{item.archivo_blade}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-docuflow-primary">
                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-docuflow-slate" />
                      <span>{item.ruta_web}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.etiqueta_svm === 1
                          ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                          : 'bg-docuflow-input text-docuflow-slate'
                      }`}
                    >
                      {item.etiqueta_svm === 1 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-docuflow-cyan" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5 text-docuflow-slate" />
                      )}
                      <span>{item.clasificacion}</span>
                      <span className="font-mono text-[10px] opacity-75">
                        ({item.etiqueta_svm})
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {item.elementos_detectados.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-docuflow-input px-2 py-0.5 font-mono text-[11px] font-medium text-docuflow-navy"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
