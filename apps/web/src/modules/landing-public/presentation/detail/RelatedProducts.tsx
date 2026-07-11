import { useI18n } from "@shared/i18n";
import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { ProductCard } from "@landing-public/presentation/cards/ProductCard";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

export function RelatedProducts({ products }: { products: HomeProduct[] }) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-6 font-bold">{t("lpDetailRelatedTitle")}</h2>
      <StaggerChildren className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => <FadeInUp key={p.id} stagger><ProductCard product={p} /></FadeInUp>)}
      </StaggerChildren>
    </section>
  );
}
