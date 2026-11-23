'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface FreemiumInterstitialModalProps {
  open: boolean;
  secondsTotal?: number;
  projectName: string;
  actionTitle?: string;
  actionDescription?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function FreemiumInterstitialModal({
  open,
  secondsTotal = 15,
  projectName,
  actionTitle,
  actionDescription,
  onComplete,
  onCancel,
}: FreemiumInterstitialModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(secondsTotal);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(secondsTotal);
      return;
    }

    setSecondsLeft(secondsTotal);
    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [open, secondsTotal]);

  useEffect(() => {
    if (open && secondsLeft === 0) {
      onComplete();
    }
  }, [open, secondsLeft, onComplete]);

  if (!open) {
    return null;
  }

  const progressPct = Math.round(
    ((secondsTotal - secondsLeft) / secondsTotal) * 100,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-docuflow-navy/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-docuflow-orange/15 px-3 py-1 text-xs font-bold text-docuflow-orange">
            Anuncio · Plan Freemium Explorer
          </span>
          <span className="text-sm font-bold text-docuflow-primary">
            {secondsLeft}s
          </span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-docuflow-navy">
          {actionTitle ??
            `Preparando cola de análisis SVM para "${projectName}"`}
        </h3>
        <p className="mt-1.5 text-sm text-docuflow-slate">
          {actionDescription ??
            'Los usuarios del plan gratuito esperan 15 segundos antes de iniciar el procesamiento en DocuFlow AI.'}
        </p>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-docuflow-input">
          <div
            className="h-full rounded-full bg-docuflow-cyan transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-5 rounded-xl border border-docuflow-violet/30 bg-docuflow-violet/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
            Acelera tu flujo de documentación
          </p>
          <p className="mt-1 text-sm text-docuflow-navy">
            Elimina los anuncios con Pro ($399 MXN/mes) y desbloquea IEEE 830, ISO 26514 y exportación PDF limpia.
          </p>
          <Link
            href="/billing"
            className="mt-3 inline-block rounded-xl bg-docuflow-violet px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Elimina los anuncios con Pro ($399 MXN/mes)
          </Link>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-docuflow-input px-4 py-2 text-xs font-semibold text-docuflow-slate hover:bg-docuflow-input"
          >
            Cancelar carga
          </button>
          <span className="text-xs font-medium text-docuflow-slate">
            {secondsLeft > 0
              ? `Procesamiento automático en ${secondsLeft}s...`
              : 'Iniciando análisis...'}
          </span>
        </div>
      </div>
    </div>
  );
}
