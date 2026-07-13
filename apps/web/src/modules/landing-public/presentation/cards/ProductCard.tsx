import { ItemCardVertical } from "@landing-public/presentation/cards/ItemCardVertical";
import { formatPrice } from "@landing-public/utils/format-price";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

// Adapter: normaliza HomeProduct → ItemCardVertical (card vertical unificada con popup + checklist + OrderModal).
export function ProductCard({ product: p }: { product: HomeProduct }) {
  return (
    <ItemCardVertical kind="product" id={p.id} slug={p.slug} name={p.name} shortDescription={p.short_description}
      imageUrl={p.primary_image_url} priceLabel={formatPrice(p.price, p.currency)} basePrice={p.price ?? 0} ctaKey="opOrderBtn" />
  );
}
