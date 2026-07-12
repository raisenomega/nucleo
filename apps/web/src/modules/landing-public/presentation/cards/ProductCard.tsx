import { useNavigate } from "@tanstack/react-router";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { formatPrice } from "@landing-public/utils/format-price";
import type { HomeProduct } from "@landing-public/domain/landing-home.types";

// La card navega al detail /product/$slug (SPA). Antes scrolleaba a #contact (comportamiento retirado en 3.E.3.detail).
export function ProductCard({ product: p }: { product: HomeProduct }) {
  const nav = useNavigate();
  return (
    <button type="button" onClick={() => void nav({ to: "/product/$slug", params: { slug: p.slug } })} className="block w-full text-left">
      <GlassCard elevation="md" padding="sm">
        {p.primary_image_url && <img src={p.primary_image_url} alt={p.name} loading="lazy" width={640} height={360} className="mb-3 aspect-video w-full rounded-lg object-cover" />}
        <h3 className="font-bold">{p.name}</h3>
        {p.short_description && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{p.short_description}</p>}
        <div className="mt-2 flex items-baseline gap-2">
          {p.price != null && <span className="font-bold">{formatPrice(p.price, p.currency)}</span>}
          {p.compare_at_price != null && <span className="text-sm text-[color:hsl(var(--lp-muted))] line-through">{formatPrice(p.compare_at_price, p.currency)}</span>}
        </div>
      </GlassCard>
    </button>
  );
}
