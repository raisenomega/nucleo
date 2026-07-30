import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { PackageCard } from "@landing-public/presentation/cards/PackageCard";
import { SectionHeading } from "@landing-public/presentation/sections/SectionHeading";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 4s, pausa hover), 4/2/1 visibles. Título/subtítulo custom del CMS
// (home.hero.section_packages_*), fallback al i18n cuando vacío.
export function FeaturedPackages({ packages, title, subtitle }: { packages: HomePackage[]; title?: string | null; subtitle?: string | null }) {
  const { t } = useI18n();
  const heading = title || t("lpSectionPackages");
  return (
    <section id="packages" className="mx-auto max-w-7xl px-6 py-12">
      <SectionHeading title={heading} subtitle={subtitle} />
      <HorizontalCarousel items={packages} renderItem={(p) => <PackageCard pkg={p} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={4000} ariaLabel={heading} />
    </section>
  );
}
