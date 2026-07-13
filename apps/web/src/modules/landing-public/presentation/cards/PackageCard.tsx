import { ItemCardVertical } from "@landing-public/presentation/cards/ItemCardVertical";
import { formatPrice } from "@landing-public/utils/format-price";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

// Adapter: normaliza HomePackage → ItemCardVertical. badge_label se muestra como pill sobre la card.
export function PackageCard({ pkg: p }: { pkg: HomePackage }) {
  return (
    <ItemCardVertical kind="package" id={p.id} slug={p.slug} name={p.name} shortDescription={p.short_description}
      imageUrl={p.primary_image_url} priceLabel={p.price != null ? formatPrice(p.price, p.currency) : ""} basePrice={p.price ?? 0}
      ctaKey="opOrderBtn" badgeLabel={p.badge_label} />
  );
}
