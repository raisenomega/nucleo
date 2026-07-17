import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PromoOffer } from "@landing-public/domain/promo-offer.types";

const money = (n?: number) => `$${(n ?? 0).toFixed(2)}`;

// Popup de la oferta promocional (replica el PromoHero del legacy). CTA → OrderModal del servicio con cupón pre-aplicado.
export function PromoPopup({ offer, onCta, onClose }: { offer: PromoOffer; onCta: () => void; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <ScreenModal onClose={onClose}>
      <div className="relative space-y-4 p-6 text-center md:p-8">
        <button type="button" onClick={onClose} aria-label={t("opClose")} className="absolute right-3 top-3 text-muted-foreground"><X className="h-6 w-6" /></button>
        {offer.badge && <span className="inline-block rounded-full bg-[color:hsl(var(--tenant-accent-hsl))]/15 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[color:hsl(var(--tenant-accent-hsl))]">{offer.badge}</span>}
        {offer.title && <h2 style={{ fontSize: "var(--text-h2)" }} className="font-extrabold text-foreground">{offer.title}</h2>}
        <div className="flex items-end justify-center gap-2">
          <span className="text-4xl font-extrabold text-foreground">{money(offer.promo_price)}</span>
          {offer.regular_price ? <span className="text-lg text-muted-foreground line-through">{money(offer.regular_price)}</span> : null}
          {offer.price_suffix && <span className="text-sm text-muted-foreground">{offer.price_suffix}</span>}
        </div>
        {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
        <button type="button" onClick={onCta} className="w-full rounded-lg bg-green-600 px-6 py-3 text-lg font-bold text-white hover:bg-green-700">{offer.cta_text || t("promoReserveDefault")}</button>
      </div>
    </ScreenModal>
  );
}
