import { LazyMotion, m } from "framer-motion";
import type { ReactNode } from "react";

// Carga las features de animación (domAnimation) de forma lazy (import async) → chunk aparte.
// `strict` obliga a usar <m.*> (no <motion.*>): tree-shaking + punto único para swap futuro.
const loadFeatures = () => import("framer-motion").then((mod) => mod.domAnimation);

export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;
}
export { m };
