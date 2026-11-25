'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';

const MODAL_EASE = [0.22, 1, 0.36, 1] as const;

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open || isLoading) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, onCancel]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-docuflow-navy/65 p-4 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: MODAL_EASE }}
            className="w-full max-w-md rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-docuflow-orange/15 text-docuflow-orange">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-bold text-docuflow-navy"
                >
                  {title}
                </h3>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Cerrar diálogo"
                className="rounded-lg p-1.5 text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-docuflow-slate">
              {description}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="rounded-xl border border-docuflow-input bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy transition-all hover:bg-docuflow-input active:scale-[0.98] disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-orange px-4 py-2 text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>{isLoading ? 'Procesando...' : confirmLabel}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
