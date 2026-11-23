'use client';

import {
  AlertCircle,
  FileArchive,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useCallback, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { createProjectMetaSchema } from '@/core/schemas';
import type { AuthUserProfile, CreateProjectResponseDTO } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { projectPetitions } from '@/services/client/petitions';
import { FreemiumInterstitialModal } from './FreemiumInterstitialModal';

interface UploadProjectModalProps {
  open: boolean;
  user: AuthUserProfile;
  onClose: () => void;
  onSuccess: (result: CreateProjectResponseDTO) => void;
}

const FRAMEWORKS = ['Laravel 11', 'Laravel 10', 'Laravel 9', 'Laravel 8'] as const;

export function UploadProjectModal({
  open,
  user,
  onClose,
  onSuccess,
}: UploadProjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nombreProyecto, setNombreProyecto] = useState('');
  const [framework, setFramework] = useState<string>('Laravel 11');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pipelinePhase, setPipelinePhase] = useState<string>('');
  const [showInterstitial, setShowInterstitial] = useState(false);

  const executeUpload = useCallback(async () => {
    if (!selectedFile) {
      return;
    }

    setShowInterstitial(false);
    setIsUploading(true);
    setErrorMessage(null);
    setPipelinePhase('Subiendo archivo y ejecutando filtro SVM + redacción IA...');

    try {
      const formData = new FormData();
      formData.append('nombre_proyecto', nombreProyecto.trim());
      formData.append('framework', framework);
      formData.append('file', selectedFile);

      const created = await projectPetitions.uploadZip(formData);
      setNombreProyecto('');
      setSelectedFile(null);
      setPipelinePhase('');
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Error inesperado al procesar el archivo .zip.');
      }
    } finally {
      setIsUploading(false);
      setPipelinePhase('');
    }
  }, [framework, nombreProyecto, onClose, onSuccess, selectedFile]);

  if (!open) {
    return null;
  }

  function handleFilePicked(file: File | undefined) {
    setErrorMessage(null);
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('Solo se admiten paquetes comprimidos con extensión .zip.');
      return;
    }

    const maxBytes = user.plan_details.max_zip_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(
        `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(2)} MB y excede el límite de ${user.plan_details.max_zip_mb} MB del plan ${user.plan.nombre}.`,
      );
      return;
    }

    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFilePicked(event.dataTransfer.files[0]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const parsed = createProjectMetaSchema.safeParse({
      nombre_proyecto: nombreProyecto,
      framework,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrorMessage(
        flat.nombre_proyecto?.[0] ?? flat.framework?.[0] ?? 'Datos inválidos.',
      );
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Selecciona o arrastra un archivo .zip de tu proyecto Laravel.');
      return;
    }

    if (user.plan_details.intersticial_segundos > 0) {
      setShowInterstitial(true);
      return;
    }

    void executeUpload();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-docuflow-navy/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-xl rounded-2xl border border-docuflow-input bg-docuflow-surface p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-docuflow-navy">
                <FileArchive className="h-5 w-5 text-docuflow-primary" />
                <span>Nuevo Proyecto Laravel (.zip)</span>
              </h2>
              <p className="mt-1 text-xs text-docuflow-slate">
                Límites de tu plan <strong>{user.plan.nombre}</strong>: hasta{' '}
                {user.plan_details.max_zip_mb} MB y {user.plan_details.max_vistas_blade} vistas{' '}
                <code>.blade.php</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              aria-label="Cerrar modal"
              className="rounded-lg p-1.5 text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="mt-4 flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-3 text-sm text-docuflow-navy"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
                >
                  Nombre del proyecto
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={nombreProyecto}
                  onChange={(e) => setNombreProyecto(e.target.value)}
                  placeholder="Ej. Sistema CRM Ventas"
                  disabled={isUploading}
                  className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="project-framework"
                  className="block text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
                >
                  Versión Laravel
                </label>
                <select
                  id="project-framework"
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  disabled={isUploading}
                  className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
                >
                  {FRAMEWORKS.map((fw) => (
                    <option key={fw} value={fw}>
                      {fw}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-docuflow-cyan bg-docuflow-cyan/10'
                  : 'border-docuflow-input bg-docuflow-bg/40 hover:border-docuflow-action'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => handleFilePicked(e.target.files?.[0])}
                className="hidden"
              />
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-docuflow-surface text-docuflow-primary shadow-sm">
                <UploadCloud className="h-5 w-5" />
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-docuflow-primary">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-docuflow-slate">
                    {(selectedFile.size / 1024).toFixed(1)} KB | Listo para filtro SVM
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-docuflow-navy">
                    Arrastra tu archivo <span className="text-docuflow-action">.zip</span> aquí
                  </p>
                  <p className="mt-1 text-xs text-docuflow-slate">
                    o haz clic para seleccionarlo (inspección real de vistas .blade.php)
                  </p>
                </div>
              )}
            </div>

            {isUploading && pipelinePhase ? (
              <div className="flex items-center gap-3 rounded-xl bg-docuflow-cyan/10 px-4 py-3 text-xs font-semibold text-docuflow-navy">
                <Loader2 className="h-4 w-4 animate-spin text-docuflow-cyan" />
                <span>{pipelinePhase}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="rounded-xl border border-docuflow-input px-4 py-2 text-xs font-semibold text-docuflow-slate hover:bg-docuflow-input disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-docuflow-action disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isUploading ? 'Procesando .zip...' : 'Procesar .zip con SVM + IA'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <FreemiumInterstitialModal
        open={showInterstitial}
        secondsTotal={user.plan_details.intersticial_segundos || 15}
        projectName={nombreProyecto || 'Proyecto Laravel'}
        onComplete={() => void executeUpload()}
        onCancel={() => setShowInterstitial(false)}
      />
    </>
  );
}
