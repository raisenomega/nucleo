import { useI18n } from "@shared/i18n";
import { HorizontalCarousel } from "@landing-public/presentation/carousels/HorizontalCarousel";
import { ProductCard } from "@landing-public/presentation/cards/ProductCard";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

// Destacados como carrusel horizontal (auto 4s, pausa hover), 4/2/1 visibles. renderItem reusa la ProductCard adapter.
export function FeaturedProducts({ products }: { products: HomeProduct[] }) {
  const { t } = useI18n();
  return (
    <section id="products" className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpSectionProducts")}</h2>
      <HorizontalCarousel items={products} renderItem={(p) => <ProductCard product={p} />}
        visibleDesktop={4} visibleTablet={2} visibleMobile={1} autoplayMs={4000} ariaLabel={t("lpSectionProducts")} />
    </section>
  );
}
