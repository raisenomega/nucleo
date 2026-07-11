import type { ReactNode } from "react";
import { m } from "@landing-public/motion/motion-loader";
import { useReducedMotion } from "@landing-public/utils/reduced-motion";

export interface FadeInUpProps {
  children: ReactNode; delay?: number; duration?: number; distance?: number; stagger?: boolean; className?: string;
}

// Fade + subida al entrar en viewport. `stagger`=hijo de StaggerChildren (hereda el trigger del padre).
export function FadeInUp({ children, delay = 0, duration = 0.6, distance = 24, stagger = false, className }: FadeInUpProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  const variants = {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0, transition: { duration, delay, ease: [0.22, 1, 0.36, 1] as const } },
  };
  if (stagger) return <m.div className={className} variants={variants}>{children}</m.div>;
  return <m.div className={className} variants={variants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}>{children}</m.div>;
}
