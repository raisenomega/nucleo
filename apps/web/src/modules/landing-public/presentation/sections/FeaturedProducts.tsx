import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { ProductCard } from "@landing-public/presentation/cards/ProductCard";
import { SectionHeading } from "@landing-public/presentation/sections/SectionHeading";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 4s, pausa hover), 4/2/1 visibles. Título/subtítulo custom del CMS
// (home.hero.section_products_*), fallback al i18n cuando vacío.
export function FeaturedProducts({ products, title, subtitle }: { products: HomeProduct[]; title?: string | null; subtitle?: string | null }) {
  const { t } = useI18n();
  const heading = title || t("lpSectionProducts");
  return (
    <section id="products" className="mx-auto max-w-7xl px-6 py-12">
      <SectionHeading title={heading} subtitle={subtitle} />
      <HorizontalCarousel items={products} renderItem={(p) => <ProductCard product={p} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={4000} ariaLabel={heading} />
    </section>
  );
}
