import { ProductCard } from "@landing-public/presentation/cards/ProductCard";
import { ServiceCard } from "@landing-public/presentation/cards/ServiceCard";
import { PackageCard } from "@landing-public/presentation/cards/PackageCard";
import type { CatalogItem } from "@landing-public/domain/landing-catalog.types";

// Discrimina por kind → reusa la card específica. El catálogo normaliza (sin pricing_type/badge_label) → defaults.
export function CatalogItemCard({ item: i }: { item: CatalogItem }) {
  const b = { id: i.id, slug: i.slug, name: i.name, short_description: i.short_description, primary_image_url: i.primary_image_url };
  if (i.kind === "service")
    return <ServiceCard service={{ ...b, pricing_type: "fixed", price: i.price, price_unit: null }} />;
  if (i.kind === "package")
    return <PackageCard pkg={{ ...b, price: i.price ?? 0, compare_at_price: i.compare_at_price, currency: i.currency, badge_label: null }} />;
  return <ProductCard product={{ ...b, price: i.price ?? 0, compare_at_price: i.compare_at_price, currency: i.currency }} />;
}
