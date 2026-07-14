import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { PackageCard } from "@landing-public/presentation/cards/PackageCard";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 4s, pausa hover), 4/2/1 visibles. renderItem reusa la PackageCard adapter.
export function FeaturedPackages({ packages }: { packages: HomePackage[] }) {
  const { t } = useI18n();
  return (
    <section id="packages" className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpSectionPackages")}</h2>
      <HorizontalCarousel items={packages} renderItem={(p) => <PackageCard pkg={p} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={4000} ariaLabel={t("lpSectionPackages")} />
    </section>
  );
}
