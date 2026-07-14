import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 4s, pausa hover), 4/2/1 visibles. renderItem reusa la ServiceCard adapter.
export function FeaturedServices({ services }: { services: HomeService[] }) {
  const { t } = useI18n();
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpSectionServices")}</h2>
      <HorizontalCarousel items={services} renderItem={(s) => <ServiceCard service={s} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={4000} ariaLabel={t("lpSectionServices")} />
    </section>
  );
}
