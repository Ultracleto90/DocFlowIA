'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = '',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === 'dark'
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro nocturno'
      }
      title={
        theme === 'dark'
          ? 'Cambiar a modo claro'
          : 'Cambiar a modo oscuro nocturno'
      }
      className={`inline-flex items-center gap-2 rounded-xl border border-docuflow-border/80 bg-docuflow-surface px-2.5 py-2 text-xs font-semibold text-docuflow-navy transition-all hover:bg-docuflow-input active:scale-[0.98] ${className}`}
    >
      <Sun className="hidden h-4 w-4 text-docuflow-cyan dark:block" />
      <Moon className="block h-4 w-4 text-docuflow-primary dark:hidden" />
      {showLabel ? (
        <>
          <span className="hidden dark:inline">Modo Claro</span>
          <span className="inline dark:hidden">Modo Nocturno</span>
        </>
      ) : null}
    </button>
  );
}
