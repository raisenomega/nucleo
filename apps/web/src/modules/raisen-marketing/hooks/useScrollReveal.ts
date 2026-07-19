import { useEffect, useRef, useState } from "react";

// Scroll-reveal de OMEGA (IntersectionObserver · revela una vez y deja de observar). Portado verbatim.
export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, isVisible };
}
