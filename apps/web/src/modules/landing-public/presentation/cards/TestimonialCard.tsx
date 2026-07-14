import { StarRatingDisplay } from "@landing-public/presentation/StarRatingDisplay";
import { getInitials, getFallbackColor } from "@landing-public/utils/avatar-fallback";
import type { HomeTestimonial } from "@landing-public/domain/landing-home.types";

// Card sólida (blanca) — se muestra sobre el banner verde de testimonios; contraste fijo, independiente del tema.
export function TestimonialCard({ t }: { t: HomeTestimonial }) {
  return (
    <article className="flex h-full flex-col items-center rounded-2xl border border-black/5 bg-white/95 p-6 text-center shadow-md">
      {t.client_avatar_url ? (
        <img src={t.client_avatar_url} alt={t.client_name} loading="lazy" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: getFallbackColor(t.client_name) }}>{getInitials(t.client_name)}</div>
      )}
      <div className="mt-3"><StarRatingDisplay value={t.rating ?? 5} /></div>
      <p className="mt-3 line-clamp-6 flex-1 text-sm italic text-gray-700">“{t.content}”</p>
      <footer className="mt-4">
        <p className="font-bold text-gray-900">{t.client_name}</p>
        {t.client_title && <p className="text-xs text-gray-500">{t.client_title}</p>}
      </footer>
    </article>
  );
}
