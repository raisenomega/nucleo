import type { ReactNode } from "react";
import { m } from "@landing-public/motion/motion-loader";
import { useReducedMotion } from "@landing-public/utils/reduced-motion";

export interface StaggerChildrenProps { children: ReactNode; stagger?: number; className?: string; }

// Orquesta la revelación escalonada de hijos <FadeInUp stagger> (heredan hidden/show).
export function StaggerChildren({ children, stagger = 0.08, className }: StaggerChildrenProps) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <m.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}>
      {children}
    </m.div>
  );
}
