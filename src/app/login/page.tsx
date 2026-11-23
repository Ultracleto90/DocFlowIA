import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-docuflow-bg p-6">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 text-center text-sm text-docuflow-slate shadow-sm">
            Cargando formulario de acceso...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
