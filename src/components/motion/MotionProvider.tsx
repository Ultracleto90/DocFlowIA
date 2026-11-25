'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

const DOCUFLOW_EASE = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.2, ease: DOCUFLOW_EASE }}
    >
      {children}
    </MotionConfig>
  );
}
