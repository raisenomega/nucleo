import { useI18n } from "@shared/i18n";
import { CategoriesStrip } from "@landing-public/presentation/sections/CategoriesStrip";
import { FeaturedProducts } from "@landing-public/presentation/sections/FeaturedProducts";
import { FeaturedServices } from "@landing-public/presentation/sections/FeaturedServices";
import { FeaturedPackages } from "@landing-public/presentation/sections/FeaturedPackages";
import { FinalCta } from "@landing-public/presentation/sections/FinalCta";
import type { LandingHome } from "@landing-public/domain/landing-home.types";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Bloques debajo del hero. Skip-empty: cada sección solo se renderiza si tiene items. FinalCta siempre (ancla).
export function HomeSections({ home }: { home: LandingHome | null }) {
  const { t } = useI18n();
  return (
    <>
      {home && home.categories.length > 0 && <CategoriesStrip categories={home.categories} onCategoryClick={() => scrollTo("products")} />}
      {home && home.featured_products.length > 0 && <FeaturedProducts products={home.featured_products} onCardClick={() => scrollTo("contact")} />}
      {home && home.featured_services.length > 0 && <FeaturedServices services={home.featured_services} onCardClick={() => scrollTo("contact")} />}
      {home && home.featured_packages.length > 0 && <FeaturedPackages packages={home.featured_packages} onCardClick={() => scrollTo("contact")} />}
      <FinalCta title={t("lpFinalCtaTitle")} subtitle={t("lpFinalCtaSubtitle")} ctaLabel={t("lpFinalCtaLabel")} ctaHref="#contact" />
    </>
  );
}
