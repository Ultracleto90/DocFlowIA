'use client';

import {
  Cpu,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import type { AuthUserProfile } from '@/core/types';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { authPetitions } from '@/services/client/petitions';

interface AppShellProps {
  user: AuthUserProfile;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const enterpriseWhiteLabel =
    user.plan.nombre === 'Enterprise' ? user.white_label : null;

  const canSeeAudit =
    user.rol === 'Administrador' || user.plan.nombre === 'Enterprise';

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      match: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      href: '/billing',
      label: 'Planes y Equipo',
      match: '/billing',
      icon: CreditCard,
    },
    ...(canSeeAudit
      ? [
          {
            href: '/admin/audit',
            label: 'Bitácora QA',
            match: '/admin',
            icon: ShieldAlert,
          },
        ]
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-docuflow-border/80 bg-docuflow-surface md:flex">
        <div className="flex h-16 items-center border-b border-docuflow-border/80 px-5">
          <BrandLogo
            href="/dashboard"
            subtitle="Laravel Docs SaaS"
            whiteLabel={enterpriseWhiteLabel}
          />
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-5">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.match);
            const Icon = item.icon;
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
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {active ? (
                  <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-docuflow-border/80 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-docuflow-slate transition-colors hover:bg-docuflow-input hover:text-docuflow-navy"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Ver inicio (Landing)</span>
          </Link>

          <div className="rounded-xl border border-docuflow-border/60 bg-docuflow-elevated/70 p-3.5">
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
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-docuflow-navy">
              <Cpu className="h-3.5 w-3.5 text-docuflow-violet" />
              <span>Motor {user.plan_details.nivel_ia}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-docuflow-slate">
              {user.plan_details.modelo_ia}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-docuflow-border/80 bg-docuflow-surface px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <BrandLogo
                href="/dashboard"
                size="sm"
                whiteLabel={enterpriseWhiteLabel}
              />
            </div>
            <span className="hidden items-center gap-2 rounded-full border border-docuflow-border/70 bg-docuflow-elevated px-3 py-1 text-xs font-semibold text-docuflow-primary sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-docuflow-cyan" />
              Human-in-the-loop | SVM + {user.plan_details.nivel_ia}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border px-2.5 py-1.5 text-xs font-medium text-docuflow-slate hover:bg-docuflow-input hover:text-docuflow-navy md:hidden"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Inicio</span>
            </Link>

            <ThemeToggle />

            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-docuflow-navy">
                {user.nombre}
              </p>
              <p className="text-[11px] text-docuflow-slate">
                {user.rol} | {user.correo}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-docuflow-border bg-docuflow-surface px-3 py-2 text-xs font-semibold text-docuflow-navy transition-all hover:bg-docuflow-input active:scale-[0.98] disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5 text-docuflow-slate" />
              <span className="hidden sm:inline">
                {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
