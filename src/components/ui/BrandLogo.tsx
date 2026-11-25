'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { WhiteLabelConfig } from '@/core/types';

interface BrandLogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  whiteLabel?: Partial<WhiteLabelConfig> | null;
  className?: string;
}

const PROBE_CANDIDATES = ['/logo.svg', '/logo.png'] as const;

export function BrandLogo({
  href,
  size = 'md',
  subtitle,
  whiteLabel,
  className = '',
}: BrandLogoProps) {
  const [probeIndex, setProbeIndex] = useState(0);
  const [loadedAsset, setLoadedAsset] = useState<string | null>(null);
  const [wlLogoFailed, setWlLogoFailed] = useState(false);

  const isWhiteLabel =
    Boolean(whiteLabel?.enabled) && Boolean(whiteLabel?.brand_name?.trim());

  const iconBoxSize =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const titleSize =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  const brandName = isWhiteLabel
    ? whiteLabel!.brand_name!.trim()
    : 'DocuFlow';
  const effectiveSubtitle = isWhiteLabel
    ? subtitle ?? 'Enterprise White-Label'
    : subtitle;

  const probeSrc =
    !isWhiteLabel && probeIndex < PROBE_CANDIDATES.length
      ? PROBE_CANDIDATES[probeIndex]
      : null;

  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      {/* Silent probe for custom /logo.svg or /logo.png in public/ without broken-img flash */}
      {probeSrc && !loadedAsset ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={probeSrc}
            alt=""
            aria-hidden="true"
            onLoad={() => setLoadedAsset(probeSrc)}
            onError={() => setProbeIndex((prev) => prev + 1)}
            className="pointer-events-none absolute h-0 w-0 opacity-0"
          />
        </>
      ) : null}

      {isWhiteLabel ? (
        whiteLabel?.logo_url && !wlLogoFailed ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={whiteLabel.logo_url}
              alt={brandName}
              onError={() => setWlLogoFailed(true)}
              className={`${iconBoxSize} shrink-0 rounded-xl border border-docuflow-border/60 bg-docuflow-surface object-contain p-1`}
            />
          </>
        ) : (
          <span
            className={`flex ${iconBoxSize} shrink-0 items-center justify-center rounded-xl bg-docuflow-primary font-display text-xs font-bold tracking-tight text-white shadow-sm`}
          >
            {brandName.slice(0, 2).toUpperCase()}
          </span>
        )
      ) : loadedAsset ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={loadedAsset}
            alt="DocuFlow AI"
            className={`${iconBoxSize} shrink-0 rounded-xl object-contain`}
          />
        </>
      ) : (
        <span
          className={`relative flex ${iconBoxSize} shrink-0 items-center justify-center rounded-xl border border-docuflow-cyan/30 bg-docuflow-elevated text-docuflow-cyan shadow-sm dark:bg-[#0E1B36]`}
        >
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              d="M7 8.5L16 4L25 8.5V19.5L16 28L7 19.5V8.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 13H20M12 17.5H17.5"
              stroke="#EDF4FF"
              className="stroke-docuflow-navy dark:stroke-[#EDF4FF]"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="21.5" cy="17.5" r="2" fill="currentColor" />
          </svg>
        </span>
      )}

      <span className="min-w-0 text-left leading-tight">
        <span
          className={`block truncate font-display ${titleSize} font-bold tracking-tight text-docuflow-navy`}
        >
          {isWhiteLabel ? (
            brandName
          ) : (
            <>
              DocuFlow <span className="text-docuflow-cyan">AI</span>
            </>
          )}
        </span>
        {effectiveSubtitle ? (
          <span className="block truncate text-[11px] font-medium text-docuflow-slate">
            {effectiveSubtitle}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-xl transition-opacity hover:opacity-90"
      >
        {content}
      </Link>
    );
  }

  return content;
}
