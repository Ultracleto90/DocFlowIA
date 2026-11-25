'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type DocuflowTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'docuflow_theme';

interface ThemeContextValue {
  theme: DocuflowTheme;
  setTheme: (next: DocuflowTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyThemeToDocument(theme: DocuflowTheme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<DocuflowTheme>('dark');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      const initial: DocuflowTheme = stored === 'light' ? 'light' : 'dark';
      setThemeState(initial);
      applyThemeToDocument(initial);
    } catch {
      applyThemeToDocument('dark');
    }
  }, []);

  const setTheme = useCallback((next: DocuflowTheme) => {
    setThemeState(next);
    applyThemeToDocument(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: DocuflowTheme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(next);
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage failures in restricted contexts
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
