'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const DOCUFLOW_EASE = [0.22, 1, 0.36, 1] as const;

export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: DOCUFLOW_EASE }}
    >
      {children}
    </motion.div>
  );
}
