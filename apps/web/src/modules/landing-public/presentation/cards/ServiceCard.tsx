import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { pricingLabel } from "@landing-public/utils/pricing-label";
import type { HomeService } from "@landing-public/domain/landing-home.types";

// Navega al detail /service/$slug (SPA). Retiró el scroll a #contact en 3.E.3.detail-service+package.
export function ServiceCard({ service: s }: { service: HomeService }) {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <button type="button" onClick={() => void nav({ to: "/service/$slug", params: { slug: s.slug } })} className="block w-full text-left">
      <GlassCard elevation="md" padding="sm">
        {s.primary_image_url && <img src={s.primary_image_url} alt={s.name} loading="lazy" width={640} height={360} className="mb-3 aspect-video w-full rounded-lg object-cover" />}
        <h3 className="font-bold">{s.name}</h3>
        {s.short_description && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{s.short_description}</p>}
        <span className="mt-2 block font-bold">{pricingLabel(s, t)}</span>
      </GlassCard>
    </button>
  );
}
