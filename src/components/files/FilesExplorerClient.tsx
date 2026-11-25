'use client';

import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderArchive,
  FolderOpen,
  FolderTree,
  Lock,
  Package,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import type {
  AuthUserProfile,
  FilesExplorerResponseDTO,
  ProjectFileCategory,
  ProjectVirtualFileItem,
} from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import {
  authPetitions,
  documentPetitions,
  filesPetitions,
  projectPetitions,
} from '@/services/client/petitions';

type CategoryFilter = 'all' | 'bundles' | 'manual' | 'topologia_ia' | 'seguridad';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return 'N/D';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function getFileIcon(category: ProjectFileCategory, ext: string) {
  if (category === 'kit_bundle') return Package;
  if (category === 'zip_original') return FolderArchive;
  if (category === 'seguridad') return ShieldCheck;
  if (ext === 'json') return FileJson;
  if (category === 'topologia_ia') return FileCode2;
  return FileText;
}

const CATEGORY_LABELS: Record<ProjectFileCategory, string> = {
  kit_bundle: 'Kit Completo',
  zip_original: 'Fuente .zip',
  manual: 'Manual MD',
  topologia_ia: 'Topología IA',
  seguridad: 'Seguridad',
};

export function FilesExplorerClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProjectParam = searchParams.get('project')?.toUpperCase() ?? null;

  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [explorer, setExplorer] = useState<FilesExplorerResponseDTO | null>(null);
  const [selectedFolderCode, setSelectedFolderCode] = useState<string | 'ALL'>(
    initialProjectParam ?? 'ALL',
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [meRes, explorerRes] = await Promise.all([
        authPetitions.me(),
        filesPetitions.listExplorer(),
      ]);
      setUser(meRes.user);
      setExplorer(explorerRes);

      if (
        initialProjectParam &&
        explorerRes.folders.some(
          (f) => f.project.codigo_proyecto === initialProjectParam,
        )
      ) {
        setSelectedFolderCode(initialProjectParam);
      } else if (
        initialProjectParam &&
        !explorerRes.folders.some(
          (f) => f.project.codigo_proyecto === initialProjectParam,
        )
      ) {
        setSelectedFolderCode('ALL');
      }
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 401) {
        router.push('/login?next=/files');
        return;
      }
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : 'No se pudo cargar la biblioteca de archivos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [initialProjectParam, router]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function handleDownloadFile(
    codigoProyecto: string,
    file: ProjectVirtualFileItem,
  ) {
    if (!file.available) return;
    setDownloadingId(file.id);
    setErrorMessage(null);
    try {
      if (file.document_id) {
        await documentPetitions.exportMarkdown(file.document_id, file.filename);
      } else if (file.artifact_key) {
        await projectPetitions.downloadArtifact(
          codigoProyecto,
          file.artifact_key,
          file.filename,
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof HttpError
          ? err.message
          : `No se pudo descargar ${file.filename}.`,
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const activeFolder = useMemo(() => {
    if (!explorer || selectedFolderCode === 'ALL') return null;
    return (
      explorer.folders.find(
        (f) => f.project.codigo_proyecto === selectedFolderCode,
      ) ?? null
    );
  }, [explorer, selectedFolderCode]);

  const flattenedFiles = useMemo(() => {
    if (!explorer) return [];
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const candidateFolders = activeFolder ? [activeFolder] : explorer.folders;

    const rows: Array<{
      codigo_proyecto: string;
      nombre_proyecto: string;
      file: ProjectVirtualFileItem;
    }> = [];

    for (const folder of candidateFolders) {
      for (const file of folder.files) {
        const matchesCategory =
          categoryFilter === 'all' ||
          (categoryFilter === 'bundles' &&
            (file.category === 'kit_bundle' ||
              file.category === 'zip_original')) ||
          file.category === categoryFilter;

        if (!matchesCategory) continue;

        if (normalizedQuery) {
          const hay =
            `${folder.project.codigo_proyecto} ${folder.project.nombre_proyecto} ${file.filename} ${file.label}`.toLowerCase();
          if (!hay.includes(normalizedQuery)) continue;
        }

        rows.push({
          codigo_proyecto: folder.project.codigo_proyecto,
          nombre_proyecto: folder.project.nombre_proyecto,
          file,
        });
      }
    }

    return rows;
  }, [activeFolder, categoryFilter, explorer, searchQuery]);

  if (isLoading || !user || !explorer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
        <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
          {errorMessage ?? 'Indexando carpetas aisladas por proyecto...'}
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-1.5 text-xs font-medium text-docuflow-slate"
      >
        <Link href="/dashboard" className="hover:text-docuflow-primary">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-docuflow-navy">
          Biblioteca de Archivos
        </span>
      </nav>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-docuflow-navy">
            <FolderTree className="h-5 w-5 text-docuflow-cyan" />
            <span>Biblioteca Central y Carpetas Aisladas por Proyecto</span>
          </h1>
          <p className="mt-1 text-sm text-docuflow-slate">
            Cada proyecto conserva su propia carpeta aislada con su paquete .zip original, manuales Markdown, artefactos de topología IA y reporte de seguridad.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-4 py-2 text-xs font-semibold text-docuflow-navy hover:bg-docuflow-input"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Dashboard</span>
        </Link>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mb-5 flex items-center gap-2 rounded-2xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-5 py-3.5 text-sm font-semibold text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {/* Search & Type Filters */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-docuflow-border bg-docuflow-surface p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-docuflow-slate" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar archivo, proyecto (PRJ-004), TOPOLOGY.md, llms.txt..."
            className="w-full rounded-xl border border-transparent bg-docuflow-input py-2 pl-10 pr-9 text-xs text-docuflow-navy placeholder:text-docuflow-slate/70 focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-docuflow-slate hover:text-docuflow-navy"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'bundles', label: 'Kits y .zip' },
              { id: 'manual', label: 'Manuales' },
              { id: 'topologia_ia', label: 'Topología IA' },
              { id: 'seguridad', label: 'Seguridad' },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setCategoryFilter(pill.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                categoryFilter === pill.id
                  ? 'bg-docuflow-primary text-white'
                  : 'bg-docuflow-elevated text-docuflow-slate hover:text-docuflow-navy'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split Explorer */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Isolated Project Folders Sidebar */}
        <aside className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-4 shadow-sm lg:col-span-4 xl:col-span-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-docuflow-slate">
              Carpetas ({explorer.total_projects})
            </h2>
            <span className="text-[11px] font-medium text-docuflow-slate">
              {explorer.total_artifacts} archivos
            </span>
          </div>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setSelectedFolderCode('ALL')}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                selectedFolderCode === 'ALL'
                  ? 'bg-docuflow-primary text-white'
                  : 'bg-docuflow-elevated/60 text-docuflow-navy hover:bg-docuflow-input'
              }`}
            >
              <span className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 shrink-0" />
                <span>Todas las carpetas</span>
              </span>
              <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px]">
                {explorer.total_artifacts}
              </span>
            </button>

            {explorer.folders.map((folder) => {
              const isSelected =
                selectedFolderCode === folder.project.codigo_proyecto;
              const FolderIcon = isSelected ? FolderOpen : Folder;

              return (
                <div
                  key={folder.project.codigo_proyecto}
                  className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors ${
                    isSelected
                      ? 'border-docuflow-primary bg-docuflow-primary/10'
                      : 'border-transparent bg-docuflow-elevated/40 hover:border-docuflow-border hover:bg-docuflow-input/70'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedFolderCode(folder.project.codigo_proyecto)
                    }
                    className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
                  >
                    <FolderIcon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isSelected
                          ? 'text-docuflow-primary'
                          : 'text-docuflow-cyan'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold text-docuflow-navy">
                        {folder.project.codigo_proyecto}
                      </p>
                      <p className="truncate text-[11px] font-medium text-docuflow-slate">
                        {folder.project.nombre_proyecto}
                      </p>
                      <p className="mt-0.5 text-[10px] text-docuflow-slate">
                        {folder.total_files} archivos | {folder.project.framework}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    title={`Descargar Kit .zip de ${folder.project.codigo_proyecto}`}
                    aria-label={`Descargar Kit .zip de ${folder.project.codigo_proyecto}`}
                    disabled={downloadingId === `${folder.project.codigo_proyecto}:kit`}
                    onClick={() =>
                      void handleDownloadFile(
                        folder.project.codigo_proyecto,
                        folder.files[0],
                      )
                    }
                    className="shrink-0 rounded-lg border border-docuflow-border bg-docuflow-surface p-1.5 text-docuflow-navy transition-colors hover:border-docuflow-cyan hover:text-docuflow-cyan disabled:opacity-50"
                  >
                    <Package className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Folder Contents Table */}
        <section className="rounded-2xl border border-docuflow-border bg-docuflow-surface p-5 shadow-sm lg:col-span-8 xl:col-span-9">
          {activeFolder ? (
            <div className="mb-4 flex flex-col justify-between gap-3 rounded-xl border border-docuflow-border bg-docuflow-elevated/70 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-docuflow-primary px-2 py-0.5 font-mono text-xs font-bold text-white">
                    {activeFolder.project.codigo_proyecto}
                  </span>
                  <h2 className="text-sm font-bold text-docuflow-navy">
                    {activeFolder.project.nombre_proyecto}
                  </h2>
                </div>
                <p className="mt-1 text-xs text-docuflow-slate">
                  Carpeta aislada del proyecto ({activeFolder.project.framework}).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/projects/${encodeURIComponent(activeFolder.project.codigo_proyecto)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-3 py-2 text-xs font-semibold text-docuflow-navy hover:border-docuflow-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Abrir Workspace</span>
                </Link>
                <button
                  type="button"
                  disabled={
                    downloadingId === `${activeFolder.project.codigo_proyecto}:kit`
                  }
                  onClick={() =>
                    void handleDownloadFile(
                      activeFolder.project.codigo_proyecto,
                      activeFolder.files[0],
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-docuflow-cyan px-3.5 py-2 text-xs font-bold text-slate-950 transition-opacity hover:opacity-95 disabled:opacity-60"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Descargar Kit Completo (.zip)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center justify-between border-b border-docuflow-border pb-3">
              <p className="text-xs font-semibold text-docuflow-navy">
                Mostrando {flattenedFiles.length} artefacto(s) en todas las carpetas aisladas
              </p>
            </div>
          )}

          {flattenedFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-docuflow-border bg-docuflow-bg p-10 text-center text-xs text-docuflow-slate">
              No hay archivos que coincidan con tu filtro actual.
            </div>
          ) : (
            <div className="divide-y divide-docuflow-border">
              {flattenedFiles.map(({ codigo_proyecto, nombre_proyecto, file }) => {
                const Icon = getFileIcon(file.category, file.extension);
                const isBusy = downloadingId === file.id;

                return (
                  <div
                    key={file.id}
                    className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-docuflow-elevated text-docuflow-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-mono text-xs font-bold text-docuflow-navy">
                            {file.filename}
                          </span>
                          <span className="rounded-md bg-docuflow-input px-2 py-0.5 font-mono text-[10px] font-semibold text-docuflow-slate">
                            {codigo_proyecto}
                          </span>
                          <span className="rounded-full bg-docuflow-violet/15 px-2 py-0.5 text-[10px] font-semibold text-docuflow-violet">
                            {CATEGORY_LABELS[file.category]}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-docuflow-slate">
                          {file.label} ({nombre_proyecto})
                        </p>
                        <p className="mt-0.5 text-[11px] text-docuflow-slate">
                          Tamaño: {formatBytes(file.size_bytes)} | Estado:{' '}
                          <span className="font-semibold text-docuflow-navy">
                            {file.status_label}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!file.available && file.category === 'seguridad' ? (
                        <Link
                          href="/billing"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-violet/40 bg-docuflow-violet/10 px-3 py-1.5 text-xs font-semibold text-docuflow-violet hover:bg-docuflow-violet/20"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          <span>Desbloquear Team IA</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={!file.available || isBusy}
                          onClick={() =>
                            void handleDownloadFile(codigo_proyecto, file)
                          }
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                            file.available
                              ? 'border border-docuflow-border bg-docuflow-elevated text-docuflow-navy hover:border-docuflow-primary hover:bg-docuflow-primary hover:text-white disabled:opacity-50'
                              : 'cursor-not-allowed bg-docuflow-input text-docuflow-slate opacity-60'
                          }`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>
                            {isBusy
                              ? 'Descargando...'
                              : file.available
                                ? 'Descargar'
                                : 'No en disco'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
