import { useI18n } from "@shared/i18n";
import { ItemCardVertical } from "@landing-public/presentation/cards/ItemCardVertical";
import { pricingLabel } from "@landing-public/utils/pricing-label";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Adapter: normaliza HomeService → ItemCardVertical. Precio depende del pricing_type (pricingLabel). CTA por defecto
// condicional: solo pago único explícito (is_recurring===false) → "Ordenar"; recurrente o sin dato → "Suscribirme"
// (undefined preserva el comportamiento actual en Catalog/Related, que no proveen is_recurring).
export function ServiceCard({ service: s }: { service: HomeService }) {
  const { t } = useI18n();
  return (
    <ItemCardVertical kind="service" id={s.id} slug={s.slug} name={s.name} shortDescription={s.short_description}
      imageUrl={s.primary_image_url} priceLabel={pricingLabel(s, t)} basePrice={s.price ?? 0}
      ctaKey={s.is_recurring === false ? "opOrderBtn" : "opSubscribeBtn"} ctaLabel={s.cta_label} isRecurring={s.is_recurring} />
  );
}
