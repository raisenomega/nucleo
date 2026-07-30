import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import { SectionHeading } from "@landing-public/presentation/sections/SectionHeading";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 5s, pausa hover), 4/2/1 visibles. Título/subtítulo custom del CMS
// (home.hero.section_services_*), fallback al i18n cuando vacío.
export function FeaturedServices({ services, title, subtitle }: { services: HomeService[]; title?: string | null; subtitle?: string | null }) {
  const { t } = useI18n();
  const heading = title || t("lpSectionServices");
  return (
    <section id="services" className="mx-auto max-w-7xl px-6 py-12">
      <SectionHeading title={heading} subtitle={subtitle} />
      <HorizontalCarousel items={services} renderItem={(s) => <ServiceCard service={s} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={5000} ariaLabel={heading} />
    </section>
  );
}
