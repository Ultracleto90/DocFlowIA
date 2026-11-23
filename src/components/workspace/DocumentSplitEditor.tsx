'use client';

import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Code2,
  Eye,
  FileDown,
  FileText,
  Lock,
  Save,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  DOCUMENT_TYPES,
  type DocumentType,
} from '@/core/constants/plans';
import type {
  AuthUserProfile,
  GeneratedDocumentRecord,
} from '@/core/types';
import { FreemiumInterstitialModal } from '@/components/dashboard/FreemiumInterstitialModal';
import { HttpError } from '@/lib/http/basicGet';
import { documentPetitions } from '@/services/client/petitions';

interface DocumentSplitEditorProps {
  codigoProyecto: string;
  user: AuthUserProfile;
  documents: GeneratedDocumentRecord[];
  onDocumentUpdated: (updated: GeneratedDocumentRecord) => void;
}

function buildDownloadFilename(
  codigoProyecto: string,
  tipo: DocumentType,
  ext: 'md' | 'pdf',
): string {
  const slug = tipo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${codigoProyecto}_${slug}.${ext}`;
}

export function DocumentSplitEditor({
  codigoProyecto,
  user,
  documents,
  onDocumentUpdated,
}: DocumentSplitEditorProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>(
    documents[0]?.tipo_documento ?? 'Historias de Usuario (INVEST)',
  );
  const activeDoc = documents.find((d) => d.tipo_documento === selectedType);

  const [draftMarkdown, setDraftMarkdown] = useState<string>(
    activeDoc?.contenido_markdown ?? '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showMdInterstitial, setShowMdInterstitial] = useState(false);

  useEffect(() => {
    setDraftMarkdown(activeDoc?.contenido_markdown ?? '');
    setStatusMessage(null);
    setErrorMessage(null);
  }, [activeDoc?.id, activeDoc?.contenido_markdown, selectedType]);

  const unlockedSet = new Set(user.plan_details.entregables);
  const isSelectedUnlocked = unlockedSet.has(selectedType);
  const hasUnsavedChanges =
    activeDoc !== undefined && draftMarkdown !== activeDoc.contenido_markdown;

  async function handleSaveChanges() {
    if (!activeDoc) return;
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await documentPetitions.updateContent(
        activeDoc.id,
        draftMarkdown,
      );
      onDocumentUpdated(res.document);
      setStatusMessage('Cambios guardados en MongoDB correctamente.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'Error al guardar los cambios del documento.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleValidation() {
    if (!activeDoc) return;
    const nextState =
      activeDoc.estado_auditoria === 'validado_humano'
        ? 'borrador_ia'
        : 'validado_humano';

    setIsValidating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await documentPetitions.validateDocument(
        activeDoc.id,
        nextState,
      );
      onDocumentUpdated(res.document);
      setStatusMessage(
        nextState === 'validado_humano'
          ? 'Documento marcado como validado_humano y auditado.'
          : 'Documento devuelto a estado borrador_ia.',
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo actualizar el estado de auditoría.',
      );
    } finally {
      setIsValidating(false);
    }
  }

  const executeMarkdownExport = useCallback(async () => {
    if (!activeDoc) return;
    setShowMdInterstitial(false);
    setIsExporting(true);
    setErrorMessage(null);

    try {
      await documentPetitions.exportMarkdown(
        activeDoc.id,
        buildDownloadFilename(codigoProyecto, activeDoc.tipo_documento, 'md'),
      );
      setStatusMessage('Archivo Markdown (.md) descargado.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo exportar el archivo Markdown.',
      );
    } finally {
      setIsExporting(false);
    }
  }, [activeDoc, codigoProyecto]);

  function handleExportMarkdownClick() {
    if (!activeDoc) return;
    if (user.plan_details.intersticial_segundos > 0) {
      setShowMdInterstitial(true);
      return;
    }
    void executeMarkdownExport();
  }

  async function handleExportPdfClick() {
    if (!activeDoc) return;
    setIsExporting(true);
    setErrorMessage(null);
    try {
      await documentPetitions.exportPdf(
        activeDoc.id,
        buildDownloadFilename(codigoProyecto, activeDoc.tipo_documento, 'pdf'),
      );
      setStatusMessage('Archivo PDF descargado.');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo exportar el archivo PDF.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Normative Deliverable Selector */}
      <div className="flex flex-wrap gap-2.5">
        {DOCUMENT_TYPES.map((tipo) => {
          const unlocked = unlockedSet.has(tipo);
          const isSelected = selectedType === tipo;
          const matchingDoc = documents.find((d) => d.tipo_documento === tipo);

          return (
            <button
              key={tipo}
              type="button"
              onClick={() => setSelectedType(tipo)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                isSelected
                  ? 'border-docuflow-primary bg-docuflow-primary text-white shadow-sm'
                  : 'border-docuflow-input bg-docuflow-surface text-docuflow-navy hover:bg-docuflow-input'
              }`}
            >
              {!unlocked ? (
                <Lock className="h-3.5 w-3.5 text-docuflow-orange" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>{tipo}</span>
              {matchingDoc ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    matchingDoc.estado_auditoria === 'validado_humano'
                      ? 'bg-docuflow-cyan/25 text-docuflow-cyan'
                      : 'bg-docuflow-orange/20 text-docuflow-orange'
                  }`}
                >
                  {matchingDoc.estado_auditoria === 'validado_humano'
                    ? 'Validado'
                    : 'Borrador'}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {!isSelectedUnlocked ? (
        <div className="rounded-2xl border border-docuflow-violet/30 bg-docuflow-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-docuflow-violet/10 text-docuflow-violet">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-docuflow-violet">
            Entregable bloqueado en Plan {user.plan.nombre}
          </p>
          <h3 className="mt-2 text-lg font-bold text-docuflow-navy">
            {selectedType} requiere Plan Pro o superior
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-docuflow-slate">
            El plan Freemium incluye únicamente Historias de Usuario (INVEST). Actualiza a Pro ($399 MXN/mes) para generar Manual Técnico IEEE 830, Manual de Usuario ISO 26514 y exportar PDF limpio.
          </p>
          <Link
            href="/billing"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            <span>Desbloquear entregables en Planes</span>
          </Link>
        </div>
      ) : !activeDoc ? (
        <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 text-center text-sm text-docuflow-slate shadow-sm">
          No hay borrador generado para <strong>{selectedType}</strong> en este proyecto.
        </div>
      ) : (
        <>
          {/* Document Toolbar */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-docuflow-input bg-docuflow-surface p-4 shadow-sm xl:flex-row xl:items-center">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  activeDoc.estado_auditoria === 'validado_humano'
                    ? 'bg-docuflow-cyan/20 text-docuflow-navy'
                    : 'bg-docuflow-orange/15 text-docuflow-orange'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{activeDoc.estado_auditoria}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-docuflow-violet/15 px-3 py-1 text-xs font-semibold text-docuflow-violet">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{activeDoc.token_count.toLocaleString()} tokens</span>
              </span>
              <span className="rounded-full bg-docuflow-input px-3 py-1 text-xs font-medium text-docuflow-slate">
                {activeDoc.modelo_ia}
              </span>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-docuflow-orange">
                  <CircleDot className="h-3.5 w-3.5" />
                  <span>Cambios sin guardar</span>
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                disabled={isSaving || !hasUnsavedChanges}
                className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-docuflow-action disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleToggleValidation()}
                disabled={isValidating}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  activeDoc.estado_auditoria === 'validado_humano'
                    ? 'border border-docuflow-cyan bg-docuflow-cyan/15 text-docuflow-navy'
                    : 'bg-docuflow-cyan text-docuflow-navy hover:opacity-90'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {isValidating
                    ? 'Actualizando...'
                    : activeDoc.estado_auditoria === 'validado_humano'
                      ? 'Validado (volver a borrador)'
                      : 'Marcar como Validado (validado_humano)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportMarkdownClick}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-input bg-docuflow-bg/60 px-3.5 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input disabled:opacity-50"
              >
                <FileDown className="h-3.5 w-3.5 text-docuflow-primary" />
                <span>Exportar .md</span>
              </button>

              {user.plan_details.pdf_habilitado ? (
                <button
                  type="button"
                  onClick={() => void handleExportPdfClick()}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-violet px-3.5 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Exportar .pdf</span>
                </button>
              ) : (
                <Link
                  href="/billing"
                  title="Exportación PDF disponible desde Plan Pro ($399 MXN/mes)"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-3.5 py-2 text-xs font-semibold text-docuflow-orange hover:bg-docuflow-orange/20"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Exportar .pdf (Pro)</span>
                </Link>
              )}
            </div>
          </div>

          {statusMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-surface px-4 py-3 text-xs font-semibold text-docuflow-navy">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
              <span>{statusMessage}</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-3 text-xs font-semibold text-docuflow-navy"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Split-View Markdown Editor & Live Preview */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-docuflow-input bg-docuflow-bg/40 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-docuflow-slate">
                  <Code2 className="h-4 w-4 text-docuflow-primary" />
                  <span>Editor Markdown (Human-in-the-loop)</span>
                </span>
                <span className="text-[11px] text-docuflow-slate">
                  {draftMarkdown.length} caracteres
                </span>
              </div>
              <textarea
                value={draftMarkdown}
                onChange={(e) => setDraftMarkdown(e.target.value)}
                spellCheck={false}
                className="min-h-[520px] w-full flex-1 resize-y bg-docuflow-surface p-5 font-mono text-xs leading-relaxed text-docuflow-navy focus:outline-none"
              />
            </div>

            <div className="flex flex-col overflow-hidden rounded-2xl border border-docuflow-input bg-docuflow-surface shadow-sm">
              <div className="flex items-center justify-between border-b border-docuflow-input bg-docuflow-bg/40 px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-docuflow-slate">
                  <Eye className="h-4 w-4 text-docuflow-cyan" />
                  <span>Vista Previa Renderizada</span>
                </span>
                <span className="text-[11px] font-semibold text-docuflow-primary">
                  GFM Live
                </span>
              </div>
              <article className="min-h-[520px] overflow-y-auto p-6 text-sm leading-relaxed text-docuflow-navy [&_code]:rounded [&_code]:bg-docuflow-input [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-docuflow-primary [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-docuflow-navy [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-docuflow-primary [&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-docuflow-action [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-docuflow-input [&_td]:px-3 [&_td]:py-2 [&_td]:text-xs [&_th]:border [&_th]:border-docuflow-input [&_th]:bg-docuflow-bg/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draftMarkdown}
                </ReactMarkdown>
              </article>
            </div>
          </div>

          <FreemiumInterstitialModal
            open={showMdInterstitial}
            secondsTotal={user.plan_details.intersticial_segundos || 15}
            projectName={codigoProyecto}
            actionTitle={`Preparando exportación Markdown (.md) para ${codigoProyecto}`}
            actionDescription="Los usuarios Freemium esperan 15 segundos y el archivo incluye firma DocuFlow AI. Actualiza a Pro para descargas instantáneas y PDF limpio."
            onComplete={() => void executeMarkdownExport()}
            onCancel={() => setShowMdInterstitial(false)}
          />
        </>
      )}
    </div>
  );
}
