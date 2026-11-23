import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mongoose', 'adm-zip', 'pdfkit'],
};

export default nextConfig;
