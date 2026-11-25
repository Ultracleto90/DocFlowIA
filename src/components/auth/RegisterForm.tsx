'use client';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { registerSchema } from '@/core/schemas';
import type { AuthUserProfile } from '@/core/types';
import { HttpError } from '@/lib/http/basicGet';
import { authPetitions } from '@/services/client/petitions';

interface FieldErrors {
  nombre?: string;
  correo?: string;
  password?: string;
}

export function RegisterForm() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<AuthUserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setServerError(null);

    const validation = registerSchema.safeParse({ nombre, correo, password });
    if (!validation.success) {
      const flat = validation.error.flatten().fieldErrors;
      setFieldErrors({
        nombre: flat.nombre?.[0],
        correo: flat.correo?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authPetitions.register(validation.data);
      setCreatedUser(response.user);
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setServerError(err.message);
      } else {
        setServerError('No se pudo completar el registro. Intenta nuevamente.');
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <BrandLogo href="/" size="sm" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-docuflow-violet/15 px-3 py-1 text-[11px] font-semibold text-docuflow-violet">
            <Sparkles className="h-3 w-3" />
            <span>Freemium | $0 MXN</span>
          </span>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-docuflow-navy">
          Crear cuenta en DocuFlow AI
        </h1>
        <p className="mt-1 text-sm text-docuflow-slate">
          Comienza gratis con 2 proyectos Laravel al mes y filtro SVM + Phi-3 Mini.
        </p>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-xl border border-docuflow-orange/40 bg-docuflow-orange/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-docuflow-orange" />
          <span>{serverError}</span>
        </div>
      ) : null}

      {createdUser ? (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-docuflow-cyan/40 bg-docuflow-cyan/10 px-4 py-3 text-sm text-docuflow-navy"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-docuflow-cyan" />
          <span>
            Cuenta creada para <strong>{createdUser.nombre}</strong> (Plan{' '}
            {createdUser.plan.nombre}).
          </span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="register-nombre"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            <User className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Nombre completo</span>
          </label>
          <input
            id="register-nombre"
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ana Sofía Martínez"
            className="mt-1.5 w-full rounded-xl border border-transparent bg-docuflow-input px-4 py-2.5 text-sm text-docuflow-navy placeholder:text-docuflow-slate/60 focus:border-docuflow-action focus:bg-docuflow-surface focus:outline-none"
          />
          {fieldErrors.nombre ? (
            <p className="mt-1 text-xs font-medium text-docuflow-orange">
              {fieldErrors.nombre}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="register-correo"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            <Mail className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Correo electrónico</span>
          </label>
          <input
            id="register-correo"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="desarrollador@empresa.com"
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
            htmlFor="register-password"
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-docuflow-slate"
          >
            <Lock className="h-3.5 w-3.5 text-docuflow-primary" />
            <span>Contraseña</span>
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
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
          <UserPlus className="h-4 w-4" />
          <span>{isSubmitting ? 'Creando cuenta...' : 'Registrarme gratis'}</span>
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between border-t border-docuflow-input pt-4 text-xs text-docuflow-slate">
        <span>¿Ya tienes cuenta?</span>
        <Link
          href="/login"
          className="font-semibold text-docuflow-action hover:underline"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
