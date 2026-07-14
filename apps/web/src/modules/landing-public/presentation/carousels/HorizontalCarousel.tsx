import { useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@landing-public/utils/reduced-motion";
import { useCarousel } from "@landing-public/presentation/carousels/useCarousel.hook";
import { useCarouselAutoplay } from "@landing-public/presentation/carousels/useCarouselAutoplay.hook";
import { CarouselControls } from "@landing-public/presentation/carousels/CarouselControls";
import { CarouselDots } from "@landing-public/presentation/carousels/CarouselDots";

interface Props<T> {
  items: T[]; renderItem: (item: T, index: number) => ReactNode;
  visibleDesktop: number; visibleTablet: number; visibleMobile: number;
  autoplayMs?: number; pauseOnHover?: boolean; ariaLabel: string; className?: string;
}

// Carrusel horizontal paginado reusable: autoplay opcional (pausa hover/focus + reduced-motion), swipe, teclado, a11y.
export function HorizontalCarousel<T>({ items, renderItem, visibleDesktop, visibleTablet, visibleMobile, autoplayMs = 0, pauseOnHover = true, ariaLabel, className = "" }: Props<T>) {
  const { visible, pages, index, next, prev, goTo } = useCarousel(items.length, { visibleDesktop, visibleTablet, visibleMobile });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const start = useRef(0);
  useCarouselAutoplay(next, autoplayMs, pages > 1 && !reduced && !(pauseOnHover && paused));
  return (
    <div role="region" aria-roledescription="carousel" aria-label={ariaLabel} tabIndex={0} className={`relative outline-none ${className}`}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); }}
      onTouchStart={(e) => { start.current = e.touches[0]?.clientX ?? 0; }}
      onTouchEnd={(e) => { const x = e.changedTouches[0]?.clientX; if (x == null) return; const dx = x - start.current; if (Math.abs(dx) > 50) (dx < 0 ? next : prev)(); }}>
      <div className="overflow-hidden">
        <div className="-mx-2 flex transition-transform duration-[400ms] ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {items.map((it, i) => (
            <div key={i} className="shrink-0 grow-0 px-2" style={{ flexBasis: `${100 / visible}%` }}>{renderItem(it, i)}</div>
          ))}
        </div>
      </div>
      {pages > 1 && <CarouselControls onPrev={prev} onNext={next} />}
      {pages > 1 && <CarouselDots pages={pages} index={index} onGo={goTo} />}
    </div>
  );
}
