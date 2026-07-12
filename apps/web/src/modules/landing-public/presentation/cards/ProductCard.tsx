import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { formatPrice } from "@landing-public/utils/format-price";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

// La card navega al detail /product/$slug + botón "Ordenar" que abre el checkout público (Órdenes 2.6).
export function ProductCard({ product: p }: { product: HomeProduct }) {
  const nav = useNavigate();
  const { t } = useI18n();
  const [order, setOrder] = useState(false);
  return (
    <GlassCard elevation="md" padding="sm">
      <button type="button" onClick={() => void nav({ to: "/product/$slug", params: { slug: p.slug } })} className="block w-full text-left">
        {p.primary_image_url && <img src={p.primary_image_url} alt={p.name} loading="lazy" width={640} height={360} className="mb-3 aspect-video w-full rounded-lg object-cover" />}
        <h3 className="font-bold">{p.name}</h3>
        {p.short_description && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{p.short_description}</p>}
        <div className="mt-2 flex items-baseline gap-2">
          {p.price != null && <span className="font-bold">{formatPrice(p.price, p.currency)}</span>}
          {p.compare_at_price != null && <span className="text-sm text-[color:hsl(var(--lp-muted))] line-through">{formatPrice(p.compare_at_price, p.currency)}</span>}
        </div>
      </button>
      <button type="button" onClick={() => setOrder(true)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{t("opOrderBtn")}</button>
      {order && <OrderModal item={{ kind: "product", id: p.id, name: p.name, basePrice: p.price ?? 0 }} onClose={() => setOrder(false)} />}
    </GlassCard>
  );
}
