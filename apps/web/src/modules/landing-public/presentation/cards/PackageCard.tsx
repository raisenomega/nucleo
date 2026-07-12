import { useNavigate } from "@tanstack/react-router";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { formatPrice } from "@landing-public/utils/format-price";
import type { HomePackage } from "@landing-public/domain/landing-home.types";

// Navega al detail /package/$slug (SPA). Retiró el scroll a #contact en 3.E.3.detail-service+package.
export function PackageCard({ pkg: p }: { pkg: HomePackage }) {
  const nav = useNavigate();
  return (
    <button type="button" onClick={() => void nav({ to: "/package/$slug", params: { slug: p.slug } })} className="block w-full text-left">
      <GlassCard elevation="md" padding="sm" className="relative">
        {p.badge_label && <span className="absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: "hsl(var(--tenant-accent-hsl))" }}>{p.badge_label}</span>}
        {p.primary_image_url && <img src={p.primary_image_url} alt={p.name} loading="lazy" width={640} height={360} className="mb-3 aspect-video w-full rounded-lg object-cover" />}
        <h3 className="font-bold">{p.name}</h3>
        {p.short_description && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{p.short_description}</p>}
        {p.price != null && <span className="mt-2 block font-bold">{formatPrice(p.price, p.currency)}</span>}
      </GlassCard>
    </button>
  );
}
