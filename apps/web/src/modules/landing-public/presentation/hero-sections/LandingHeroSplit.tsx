import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { ItemHighlightsChecklist } from "@landing-public/presentation/popup/ItemHighlightsChecklist";
import { OrderModal, type OrderItem } from "@orders-public/presentation/OrderModal";
import type { LandingHeroSection } from "@landing-public/domain/landing-hero.types";

// Hero secundario split: imagen 4:5 (izq) + título/subtítulo/descripción/features + 2 CTAs (der). Stack en mobile.
// CTA primaria → OrderModal del item. CTA secundaria → OrderModal del target (Soterrados) con hydroJet preseleccionado.
export function LandingHeroSplit({ s }: { s: LandingHeroSection }) {
  const { locale } = useI18n();
  const [order, setOrder] = useState<{ item: OrderItem; defaults?: Record<string, unknown> } | null>(null);
  const pick = (es: string, en: string) => (locale === "en" ? en : es);
  const primary = () => setOrder({ item: { kind: s.kind, id: s.id, name: s.name, basePrice: s.basePrice } });
  const secondary = () => s.secondaryTarget && setOrder({
    item: { kind: "service", id: s.secondaryTarget.id, name: s.secondaryTarget.name, basePrice: s.secondaryTarget.basePrice }, defaults: { hydroJet: true } });
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid items-center gap-8 md:grid-cols-2">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[color:hsl(var(--lp-muted))]/10">
          {s.imageUrl && <img src={s.imageUrl} alt={pick(s.titleEs, s.titleEn)} width={640} height={800} loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="space-y-4">
          <h2 style={{ fontSize: "var(--text-h2)" }} className="font-bold">{pick(s.titleEs, s.titleEn)}</h2>
          <p className="font-medium text-[color:hsl(var(--lp-fg))]">{pick(s.subtitleEs, s.subtitleEn)}</p>
          <p className="text-sm text-[color:hsl(var(--lp-muted))]">{pick(s.descriptionEs, s.descriptionEn)}</p>
          <ItemHighlightsChecklist highlights={s.features} />
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={primary} className="rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground">{pick(s.ctaPrimaryEs, s.ctaPrimaryEn)}</button>
            {s.secondaryTarget && s.ctaSecondaryEs && <button type="button" onClick={secondary} className="rounded-lg border border-primary px-5 py-3 font-bold text-primary">{pick(s.ctaSecondaryEs, s.ctaSecondaryEn ?? "")}</button>}
          </div>
        </div>
      </div>
      {order && <OrderModal item={order.item} defaultValues={order.defaults} onClose={() => setOrder(null)} />}
    </section>
  );
}
