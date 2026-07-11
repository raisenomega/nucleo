import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { TestimonialCard } from "@landing-public/presentation/cards/TestimonialCard";
import type { HomeTestimonial } from "@landing-public/domain/landing-home.types";

const BTN = "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur disabled:opacity-30 md:flex";

export function TestimonialsCarousel({ testimonials }: { testimonials: HomeTestimonial[] }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  function onScroll() {
    const el = ref.current; if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }
  function scroll(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.9), behavior: "smooth" });
  }
  return (
    <section role="region" aria-label={t("lpTestimonialsTitle")} className="mx-auto max-w-7xl px-6 py-12">
      <FadeInUp><h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpTestimonialsTitle")}</h2></FadeInUp>
      <div className="relative">
        <button type="button" onClick={() => scroll(-1)} disabled={atStart} aria-label={t("lpTestimonialsPrev")} className={`${BTN} left-1`}><ChevronLeft className="h-5 w-5" /></button>
        <div ref={ref} onScroll={onScroll} className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {testimonials.map((x, i) => (
            <FadeInUp key={i} className="w-full shrink-0 snap-center md:w-1/2 lg:w-1/3">
              <TestimonialCard t={x} />
            </FadeInUp>
          ))}
        </div>
        <button type="button" onClick={() => scroll(1)} disabled={atEnd} aria-label={t("lpTestimonialsNext")} className={`${BTN} right-1`}><ChevronRight className="h-5 w-5" /></button>
      </div>
    </section>
  );
}
