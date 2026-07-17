import { Sparkles } from "lucide-react";

export interface PromoHeaderCtx { title?: string; subtitle?: string; helper?: string }

// Header destacado de oferta que se muestra encima del form cuando el OrderModal se abre desde la promo.
// Los textos vienen de promo_offer (editables desde el panel), no hardcodeados.
export function PromoOrderHeader({ title, subtitle, helper }: PromoHeaderCtx) {
  return (
    <div className="rounded-lg border border-[color:hsl(var(--tenant-accent-hsl))]/30 bg-[color:hsl(var(--tenant-accent-hsl))]/10 p-4 text-center">
      {subtitle && <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[color:hsl(var(--tenant-accent-hsl))]"><Sparkles className="h-3.5 w-3.5" /> {subtitle}</span>}
      {title && <h3 className="mt-1 text-lg font-extrabold text-foreground">{title}</h3>}
      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}
