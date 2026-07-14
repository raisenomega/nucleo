import { useCallback, useEffect, useState } from "react";

export interface VisibleCfg { visibleDesktop: number; visibleTablet: number; visibleMobile: number }

// Cuántos items visibles según breakpoint (desktop ≥1024, tablet ≥768, mobile <768). SSR-safe → desktop.
function calcVisible(c: VisibleCfg): number {
  if (typeof window === "undefined") return c.visibleDesktop;
  if (window.matchMedia("(min-width: 1024px)").matches) return c.visibleDesktop;
  if (window.matchMedia("(min-width: 768px)").matches) return c.visibleTablet;
  return c.visibleMobile;
}

// Estado del carrusel paginado: página actual + navegación con loop. pages = ceil(items / visible).
export function useCarousel(count: number, cfg: VisibleCfg) {
  const [visible, setVisible] = useState(() => calcVisible(cfg));
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const on = () => setVisible(calcVisible(cfg));
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const pages = Math.max(1, Math.ceil(count / visible));
  useEffect(() => { setIndex((i) => Math.min(i, pages - 1)); }, [pages]);
  const goTo = useCallback((p: number) => setIndex(((p % pages) + pages) % pages), [pages]);
  const next = useCallback(() => setIndex((i) => (i + 1) % pages), [pages]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + pages) % pages), [pages]);
  return { visible, pages, index, next, prev, goTo };
}
