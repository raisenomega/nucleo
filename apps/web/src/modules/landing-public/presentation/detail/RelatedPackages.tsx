import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { PackageCard } from "@landing-public/presentation/cards/PackageCard";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

// Related como carrusel horizontal SIN autoplay (exploración opcional): solo controles manuales + swipe. 4/2/1.
export function RelatedPackages({ packages }: { packages: HomePackage[] }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpDetailRelatedPackagesTitle")}</h2>
      <HorizontalCarousel items={packages} renderItem={(p) => <PackageCard pkg={p} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} ariaLabel={t("lpDetailRelatedPackagesTitle")} />
    </section>
  );
}
