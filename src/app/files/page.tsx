import { Suspense } from 'react';
import { FilesExplorerClient } from '@/components/files/FilesExplorerClient';

export default function FilesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
          <div className="rounded-2xl border border-docuflow-border bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
            Cargando biblioteca central de archivos...
          </div>
        </div>
      }
    >
      <FilesExplorerClient />
    </Suspense>
  );
}
