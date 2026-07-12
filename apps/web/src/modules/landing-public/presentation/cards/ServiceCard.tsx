import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { pricingLabel } from "@landing-public/utils/pricing-label";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Navega al detail /service/$slug + botón "Suscribirme/Ordenar" que abre el checkout público (Órdenes 2.6).
export function ServiceCard({ service: s }: { service: HomeService }) {
  const { t } = useI18n();
  const nav = useNavigate();
  const [order, setOrder] = useState(false);
  return (
    <GlassCard elevation="md" padding="sm">
      <button type="button" onClick={() => void nav({ to: "/service/$slug", params: { slug: s.slug } })} className="block w-full text-left">
        {s.primary_image_url && <img src={s.primary_image_url} alt={s.name} loading="lazy" width={640} height={360} className="mb-3 aspect-video w-full rounded-lg object-cover" />}
        <h3 className="font-bold">{s.name}</h3>
        {s.short_description && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{s.short_description}</p>}
        <span className="mt-2 block font-bold">{pricingLabel(s, t)}</span>
      </button>
      <button type="button" onClick={() => setOrder(true)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{t("opSubscribeBtn")}</button>
      {order && <OrderModal item={{ kind: "service", id: s.id, name: s.name, basePrice: s.price ?? 0 }} onClose={() => setOrder(false)} />}
    </GlassCard>
  );
}
