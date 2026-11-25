import { Suspense } from 'react';
import { BillingClient } from '@/components/billing/BillingClient';

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
          <div className="rounded-2xl border border-docuflow-input bg-docuflow-surface px-8 py-6 text-sm font-medium text-docuflow-slate shadow-sm">
            Cargando planes y configuración SaaS...
          </div>
        </div>
      }
    >
      <BillingClient />
    </Suspense>
  );
}
