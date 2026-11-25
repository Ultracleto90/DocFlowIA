import path from 'node:path';
import type { IZipEntry } from 'adm-zip';
import type { SvmClassification } from '@/core/constants/plans';
import { ServiceError } from './errors';

export interface AnalyzedBladeView {
  archivo_blade: string;
  ruta_web: string;
  elementos_detectados: string[];
  etiqueta_svm: 0 | 1;
  clasificacion: SvmClassification;
  hasMissingAltOrLabel: boolean;
  hasUnescapedBlade: boolean;
  hasFormWithoutCsrf: boolean;
}

export interface BladeSourceEntry {
  archivo_blade: string;
  ruta_web: string;
  content: string;
  etiqueta_svm: 0 | 1;
  elementos_detectados: string[];
  clasificacion: SvmClassification;
}

export function normalizeZipPath(rawName: string): string {
  return rawName.replace(/\\/g, '/');
}

export function assertNoZipSlip(entries: IZipEntry[]): void {
  for (const entry of entries) {
    const normalized = normalizeZipPath(entry.entryName);
    const segments = normalized.split('/');

    if (
      normalized.startsWith('/') ||
      /^[a-zA-Z]:/.test(normalized) ||
      segments.includes('..') ||
      path.posix.normalize(normalized).startsWith('..')
    ) {
      throw new ServiceError(
        400,
        'Archivo .zip rechazado por seguridad: se detectó una ruta inválida (Zip Slip).',
        {
          code: 'ZIP_SLIP_DETECTED',
          entry: entry.entryName,
        },
      );
    }
  }
}

export function isRelevantBladeEntry(entry: IZipEntry): boolean {
  if (entry.isDirectory) {
    return false;
  }

  const normalized = normalizeZipPath(entry.entryName);
  const lower = normalized.toLowerCase();

  if (!lower.endsWith('.blade.php')) {
    return false;
  }

  if (
    lower.startsWith('__macosx/') ||
    lower.includes('/__macosx/') ||
    lower.startsWith('vendor/') ||
    lower.includes('/vendor/') ||
    lower.startsWith('node_modules/') ||
    lower.includes('/node_modules/')
  ) {
    return false;
  }

  return true;
}

export function inferWebRoute(archivoBlade: string): string {
  const normalized = normalizeZipPath(archivoBlade);
  const viewsMarker = 'resources/views/';
  const idx = normalized.toLowerCase().indexOf(viewsMarker);
  const relative =
    idx >= 0 ? normalized.slice(idx + viewsMarker.length) : normalized;
  const withoutExt = relative.replace(/\.blade\.php$/i, '');
  const cleaned = withoutExt.replace(/\/index$/i, '');

  if (!cleaned || cleaned === 'welcome' || cleaned === 'index') {
    return '/';
  }

  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'auth') {
    return `/${parts.slice(1).join('/')}`;
  }

  return `/${parts.join('/')}`;
}

export function analyzeBladeContent(
  archivoBlade: string,
  content: string,
): AnalyzedBladeView {
  const detected: string[] = [];

  if (/<form\b/i.test(content)) detected.push('form');
  if (/<input[^>]*type=["']email["']/i.test(content)) detected.push('input_email');
  if (/<input[^>]*type=["']password["']/i.test(content)) detected.push('input_password');
  if (/<input\b/i.test(content)) detected.push('input');
  if (/<button\b/i.test(content)) detected.push('button_submit');
  if (/<table\b/i.test(content)) detected.push('table');
  if (/<select\b/i.test(content)) detected.push('select');
  if (/<textarea\b/i.test(content)) detected.push('textarea');
  if (/@csrf\b/i.test(content)) detected.push('directive_csrf');
  if (/@method\s*\(/i.test(content)) detected.push('directive_method');
  if (/@(auth|guest|can|cannot)\b/i.test(content)) detected.push('directive_auth');
  if (/@(foreach|forelse|if)\b/i.test(content)) detected.push('directive_control');
  if (/route\s*\(/i.test(content)) detected.push('laravel_route');
  if (/wire:|x-data|@livewire/i.test(content)) detected.push('interactive_component');

  const lowerPath = archivoBlade.toLowerCase();
  const isLayoutOrPartial =
    /(^|\/)(layouts?|partials?|includes?|components\/footer|components\/header|footer|header|navbar|sidebar)\.blade\.php$/i.test(
      lowerPath,
    );

  const hasFunctionalSignal = detected.some((tag) =>
    [
      'form',
      'input_email',
      'input_password',
      'input',
      'button_submit',
      'table',
      'select',
      'textarea',
      'directive_csrf',
      'directive_method',
      'laravel_route',
      'interactive_component',
    ].includes(tag),
  );

  const isRelevant =
    hasFunctionalSignal &&
    (!isLayoutOrPartial || /<form\b|<table\b/i.test(content));

  if (!isRelevant) {
    const noiseTags: string[] = [];
    if (/<div\b/i.test(content)) noiseTags.push('div_container');
    if (/<a\b|<nav\b/i.test(content)) noiseTags.push('links_estaticos');
    if (/<footer\b|copyright|&copy;|©/i.test(content)) noiseTags.push('copyright_text');
    if (/@yield|@stack|@include|@section/i.test(content)) noiseTags.push('layout_wrapper');
    if (noiseTags.length === 0) noiseTags.push('markup_estatico');

    return {
      archivo_blade: archivoBlade,
      ruta_web: 'N/A',
      elementos_detectados: noiseTags,
      etiqueta_svm: 0,
      clasificacion: 'Ruido Visual',
      hasMissingAltOrLabel: false,
      hasUnescapedBlade: false,
      hasFormWithoutCsrf: false,
    };
  }

  const hasMissingAltOrLabel =
    /<img\b(?![^>]*\balt=)[^>]*>/i.test(content) ||
    (/<input\b/i.test(content) && !/<label\b|aria-label=/i.test(content));

  const hasUnescapedBlade = /\{!!\s*.+?\s*!!\}/.test(content);
  const hasFormWithoutCsrf =
    /<form\b[^>]*method=["']post["'][^>]*>/i.test(content) &&
    !/@csrf\b/i.test(content);

  return {
    archivo_blade: archivoBlade,
    ruta_web: inferWebRoute(archivoBlade),
    elementos_detectados: Array.from(new Set(detected)),
    etiqueta_svm: 1,
    clasificacion: 'Código Relevante',
    hasMissingAltOrLabel,
    hasUnescapedBlade,
    hasFormWithoutCsrf,
  };
}
