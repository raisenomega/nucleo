import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { TestimonialCard } from "@landing-public/presentation/cards/TestimonialCard";
import type { HomeTestimonial } from "@landing-public/domain/landing-home.types";

// Banner verde full-width (reemplaza la barra CTA + la sección de testimonios): carrusel auto 3s, 3/2/1 visibles.
export function TestimonialsBanner({ testimonials }: { testimonials: HomeTestimonial[] }) {
  const { t } = useI18n();
  return (
    <section className="px-6 py-16 md:py-24"
      style={{ background: "linear-gradient(135deg, hsl(var(--tenant-accent-hsl)), hsl(var(--tenant-primary-hsl)))" }}>
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-8 text-center font-bold text-white drop-shadow">{t("lpTestimonialsTitle")}</h2>
      <div className="mx-auto max-w-7xl">
        <HorizontalCarousel items={testimonials} renderItem={(x) => <TestimonialCard t={x} />}
          visibleDesktop={3} visibleTablet={2} visibleMobile={1} autoplayMs={3000} ariaLabel={t("lpTestimonialsTitle")} />
      </div>
    </section>
  );
}
