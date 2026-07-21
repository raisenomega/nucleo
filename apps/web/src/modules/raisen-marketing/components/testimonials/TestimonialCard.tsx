import { useState } from "react";
import { Quote, Star } from "lucide-react";
import { initials, avatarHsl } from "@raisen-marketing/data/avatar-initials";
import type { TestimonialRow } from "@raisen-marketing/data/testimonial.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Tarjeta de testimonio (réplica OMEGA + rating y avatar): card glass oscura, quote itálica dorada, estrellas
// doradas por rating, avatar (foto si avatar_url, si no iniciales con color HSL por hash). Fallback a iniciales
// si la imagen falla. Dorado = token primary (tema .rm-root).
export function TestimonialCard({ item, lang }: { item: TestimonialRow; lang: Lang }) {
  const [broken, setBroken] = useState(false);
  const showImg = item.avatarUrl && !broken;
  const meta = [item.clientRole, item.clientCompany].filter(Boolean).join(" · ");
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <Quote className="mb-4 h-6 w-6 text-primary" />
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < item.rating ? "fill-primary text-primary" : "text-white/20"} />)}
      </div>
      <p className="flex-1 text-sm italic leading-relaxed text-white/80">{lang === "es" ? item.quoteEs : item.quoteEn}</p>
      <div className="mt-6 flex items-center gap-3">
        {showImg
          ? <img src={item.avatarUrl!} alt={item.clientName} onError={() => setBroken(true)} loading="lazy" decoding="async" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full object-cover" />
          : <div style={{ background: avatarHsl(item.clientName) }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white">{initials(item.clientName)}</div>}
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">{item.clientName}</p>
          {meta && <p className="truncate text-xs text-white/50">{meta}</p>}
        </div>
      </div>
    </div>
  );
}
