'use client';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { loginSchema } from '@/core/schemas';
import type { AuthUserProfile } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions } from '@/services/client/petitions';

interface FieldErrors {
  correo?: string;
  password?: string;
}

function mapOAuthErrorMessage(code: string | null): string | null {
  switch (code) {
    case 'google_cancelled':
      return 'Cancelaste el inicio de sesión con Google. Puedes intentarlo nuevamente o usar tu correo.';
    case 'google_state_invalid':
      return 'La validación de seguridad de Google expiró. Intenta nuevamente.';
    case 'google_already_linked':
      return 'Esta cuenta de Google ya está vinculada a otro usuario.';
    case 'google_auth_failed':
      return 'No se pudo completar el acceso con Google. Verifica tu cuenta e intenta de nuevo.';
    default:
      return null;
  }
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextParam = searchParams.get('next');
  const oauthErrorMessage = mapOAuthErrorMessage(searchParams.get('error'));

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthUserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedError = serverError ?? oauthErrorMessage;

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
    <div className="w-full max-w-md rounded-2xl border border-docuflow-border bg-docuflow-surface p-8 shadow-xl">
      <div className="mb-6 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-docuflow-slate transition-colors hover:text-docuflow-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Link>

        <ThemeToggle />
      </div>

      <div className="mb-6">
        <BrandLogo href="/" size="sm" />
        <h1 className="mt-4 font-display text-2xl font-bold text-docuflow-navy">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-docuflow-slate">
          Accede a tus proyectos Laravel y auditorías Human-in-the-loop.
        </p>
      </div>

      {displayedError ? (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{displayedError}</span>
        </div>
      ) : null}

      {authenticatedUser ? (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
          <span>
            Sesión iniciada como <strong>{authenticatedUser.nombre}</strong> (
            {authenticatedUser.plan.nombre} | {authenticatedUser.rol}).
          </span>
        </div>
      ) : null}

      <div className="mb-4">
        <GoogleAuthButton nextPath={nextParam} label="Continuar con Google" />
        <div className="mt-4 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-docuflow-slate">
          <span className="h-px flex-1 bg-docuflow-border" />
          <span>o continúa con correo</span>
          <span className="h-px flex-1 bg-docuflow-border" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="login-correo"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            <Mail className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Correo electrónico</span>
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
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            <Lock className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Contraseña</span>
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-docuflow-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-docuflow-action active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          <span>
            {isSubmitting ? 'Verificando credenciales...' : 'Entrar a DocuFlow AI'}
          </span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-docuflow-input pt-4 text-xs text-docuflow-slate">
        <span>¿Aún no tienes cuenta?</span>
        <Link
          href={nextParam ? `/register?next=${encodeURIComponent(nextParam)}` : '/register'}
          className="font-semibold text-docuflow-action hover:underline"
        >
          Crear cuenta Freemium
        </Link>
      </div>
    </div>
  );
}
