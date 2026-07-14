import { useEffect } from "react";

// Auto-avance por intervalo. enabled ya combina: pages>1, no reduced-motion, no pausa (hover/focus). ms<=0 → off.
export function useCarouselAutoplay(advance: () => void, ms: number, enabled: boolean) {
  useEffect(() => {
    if (!enabled || ms <= 0) return;
    const id = setInterval(advance, ms);
    return () => clearInterval(id);
  }, [advance, ms, enabled]);
}
