import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Related como carrusel horizontal SIN autoplay (exploración opcional): solo controles manuales + swipe. 4/2/1.
export function RelatedServices({ services }: { services: HomeService[] }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpDetailRelatedServicesTitle")}</h2>
      <HorizontalCarousel items={services} renderItem={(s) => <ServiceCard service={s} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} ariaLabel={t("lpDetailRelatedServicesTitle")} />
    </section>
  );
}
