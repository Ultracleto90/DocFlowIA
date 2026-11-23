'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { loginSchema } from '@/core/schemas';
import type { AuthUserProfile } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions } from '@/services/client/petitions';

interface FieldErrors {
  correo?: string;
  password?: string;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthUserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError(null);

    const validation = loginSchema.safeParse({ correo, password });
    if (!validation.success) {
      const flat = validation.error.flatten().fieldErrors;
      setFieldErrors({
        correo: flat.correo?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authPetitions.login(validation.data);
      setAuthenticatedUser(response.user);

      const nextParam = searchParams.get('next');
      const safeTarget =
        nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
          ? nextParam
          : '/dashboard';

      router.push(safeTarget);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setServerError(err.message);
      } else {
        setServerError('No se pudo conectar con el servidor. Intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-docuflow-input bg-docuflow-surface p-8 shadow-sm">
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-docuflow-input px-3 py-1 text-xs font-semibold text-docuflow-primary">
          <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
          DocuFlow AI · Acceso SaaS
        </span>
        <h1 className="mt-3 text-2xl font-bold text-docuflow-navy">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-docuflow-slate">
          Accede a tus proyectos Laravel y auditorías Human-in-the-loop.
        </p>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          {serverError}
        </div>
      ) : null}

      {authenticatedUser ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          Sesión iniciada como <strong>{authenticatedUser.nombre}</strong> (
          {authenticatedUser.plan.nombre} · {authenticatedUser.rol}).
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="login-correo"
            className="block text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            Correo electrónico
          </label>
          <input
            id="login-correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="emiliano@docuflow.ia"
            className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy placeholder:text-docuflow-slate/60 focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
          />
          {fieldErrors.correo ? (
            <p className="mt-1 text-xs font-medium text-docuflow-orange">
              {fieldErrors.correo}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy placeholder:text-docuflow-slate/60 focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-xs font-medium text-docuflow-orange">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-docuflow-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-docuflow-action disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Verificando credenciales...' : 'Entrar a DocuFlow AI'}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-docuflow-input pt-4 text-xs text-docuflow-slate">
        <span>¿Aún no tienes cuenta?</span>
        <Link
          href="/register"
          className="font-semibold text-docuflow-action hover:underline"
        >
          Crear cuenta Freemium
        </Link>
      </div>
    </div>
  );
}
