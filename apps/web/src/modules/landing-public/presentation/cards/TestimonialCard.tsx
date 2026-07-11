import { GlassCard } from "@landing-public/primitives/GlassCard";
import { StarRatingDisplay } from "@landing-public/presentation/StarRatingDisplay";
import { getInitials, getFallbackColor } from "@landing-public/utils/avatar-fallback";
import type { HomeTestimonial } from "@landing-public/domain/landing-home.types";

export function TestimonialCard({ t }: { t: HomeTestimonial }) {
  return (
    <GlassCard elevation="md" padding="md" as="article" className="flex h-full flex-col items-center text-center">
      {t.client_avatar_url ? (
        <img src={t.client_avatar_url} alt={t.client_name} loading="lazy" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: getFallbackColor(t.client_name) }}>{getInitials(t.client_name)}</div>
      )}
      <div className="mt-3"><StarRatingDisplay value={t.rating ?? 5} /></div>
      <p className="mt-3 line-clamp-6 flex-1 text-sm italic text-[color:hsl(var(--lp-fg))]">“{t.content}”</p>
      <footer className="mt-4">
        <p className="font-bold">{t.client_name}</p>
        {t.client_title && <p className="text-xs text-[color:hsl(var(--lp-muted))]">{t.client_title}</p>}
      </footer>
    </GlassCard>
  );
}
