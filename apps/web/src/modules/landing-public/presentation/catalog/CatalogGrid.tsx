import { FadeInUp } from "@landing-public/motion/FadeInUp";
import { StaggerChildren } from "@landing-public/motion/StaggerChildren";
import { CatalogItemCard } from "@landing-public/presentation/catalog/CatalogItemCard";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";

export function CatalogGrid({ items }: { items: CatalogItem[] }) {
  return (
    <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => <FadeInUp key={`${i.kind}-${i.id}`} stagger><CatalogItemCard item={i} /></FadeInUp>)}
    </StaggerChildren>
  );
}
