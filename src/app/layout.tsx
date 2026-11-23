import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuFlow AI | Documentación Técnica Automatizada para Laravel',
  description:
    'Plataforma SaaS Human-in-the-loop para generación y auditoría de documentación técnica en proyectos Laravel (.blade.php).',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-docuflow-bg text-docuflow-navy">{children}</body>
    </html>
  );
}
