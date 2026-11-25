import type { Metadata } from 'next';
import {
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from 'next/font/google';
import type { ReactNode } from 'react';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DocuFlow AI | Documentación Técnica Auditada para Laravel',
  description:
    'Plataforma SaaS Human-in-the-loop para filtrar vistas .blade.php con SVM y convertir documentadores en Revisores técnicos.',
};

const THEME_INIT_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('docuflow_theme');
    var root = document.documentElement;
    if (saved === 'light') {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`dark ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-docuflow-bg font-sans text-docuflow-navy">
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
