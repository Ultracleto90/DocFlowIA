'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import type { AuthUserProfile } from '@/core/types';
import { authPetitions } from '@/services/client/petitions';

interface AppShellProps {
  user: AuthUserProfile;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isWhiteLabel =
    user.plan.nombre === 'Enterprise' &&
    Boolean(user.white_label?.enabled) &&
    Boolean(user.white_label?.brand_name?.trim());

  const brandTitle = isWhiteLabel
    ? user.white_label!.brand_name
    : 'DocuFlow AI';

  const canSeeAudit =
    user.rol === 'Administrador' || user.plan.nombre === 'Enterprise';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', match: '/dashboard' },
    { href: '/billing', label: 'Planes y Equipo', match: '/billing' },
    ...(canSeeAudit
      ? [{ href: '/admin/audit', label: 'Bitácora QA', match: '/admin' }]
      : []),
  ];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authPetitions.logout();
      router.push('/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-docuflow-bg text-docuflow-navy">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-docuflow-input bg-docuflow-surface md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-docuflow-input px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-docuflow-primary text-sm font-bold text-white">
            {brandTitle.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-docuflow-navy">
              {brandTitle}
            </p>
            <p className="text-[11px] font-medium text-docuflow-slate">
              {isWhiteLabel ? 'Enterprise White-Label' : 'Laravel Docs SaaS'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-docuflow-primary text-white shadow-sm'
                    : 'text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy'
                }`}
              >
                <span>{item.label}</span>
                {active ? (
                  <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-docuflow-input p-4">
          <div className="rounded-xl bg-docuflow-bg/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-docuflow-slate">
                Plan Activo
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  user.plan.nombre === 'Freemium'
                    ? 'bg-docuflow-orange/15 text-docuflow-orange'
                    : 'bg-docuflow-violet/15 text-docuflow-violet'
                }`}
              >
                {user.plan.nombre}
              </span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-docuflow-navy">
              Motor {user.plan_details.nivel_ia}
            </p>
            <p className="truncate text-[11px] text-docuflow-slate">
              {user.plan_details.modelo_ia}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-docuflow-input bg-docuflow-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-docuflow-navy md:hidden">
              {brandTitle}
            </span>
            <span className="hidden rounded-full bg-docuflow-input px-3 py-1 text-xs font-semibold text-docuflow-primary sm:inline-flex">
              Human-in-the-loop · SVM + {user.plan_details.nivel_ia}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-semibold text-docuflow-navy">
                {user.nombre}
              </p>
              <p className="text-[11px] text-docuflow-slate">
                {user.rol} · {user.correo}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-docuflow-input bg-docuflow-surface px-3 py-1.5 text-xs font-semibold text-docuflow-navy transition-colors hover:bg-docuflow-input disabled:opacity-60"
            >
              {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
