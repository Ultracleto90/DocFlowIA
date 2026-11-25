'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

const DOCUFLOW_EASE = [0.22, 1, 0.36, 1] as const;

const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: DOCUFLOW_EASE,
    },
  },
};

interface MotionContainerProps {
  children: ReactNode;
  className?: string;
}

export function FadeInSection({ children, className }: MotionContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: DOCUFLOW_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({ children, className }: MotionContainerProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: MotionContainerProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
