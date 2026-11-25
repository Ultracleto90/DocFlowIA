import { Suspense } from 'react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 text-center text-sm text-docuflow-slate shadow-sm">
            Cargando formulario de registro...
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </main>
  );
}
