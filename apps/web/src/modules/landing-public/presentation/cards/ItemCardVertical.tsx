import { useState } from "react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { GlassCard } from "@landing-public/primitives/GlassCard";
import { OrderModal } from "@orders-public/presentation/OrderModal";
import { ItemDetailPopup } from "@landing-public/presentation/popup/ItemDetailPopup";
import { type ItemKind } from "@landing-public/presentation/useItemDetail.hook";

export interface CardItemProps {
  kind: ItemKind; id: string; slug: string; name: string; shortDescription: string | null;
  imageUrl: string | null; priceLabel: string; basePrice: number; ctaKey: TranslationKey; badgeLabel?: string | null;
}

// Card vertical 4:5 unificada (product/service/package). Click en la card → popup (highlights viven ahí); CTA → OrderModal.
export function ItemCardVertical(p: CardItemProps) {
  const { t } = useI18n();
  const [popup, setPopup] = useState(false);
  const [order, setOrder] = useState(false);
  return (
    <GlassCard elevation="md" padding="sm" className="relative flex h-full flex-col">
      {p.badgeLabel && <span className="absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: "hsl(var(--tenant-accent-hsl))" }}>{p.badgeLabel}</span>}
      <button type="button" onClick={() => setPopup(true)} className="block w-full flex-1 text-left">
        <div className="mb-3 aspect-[4/5] w-full overflow-hidden rounded-lg bg-[color:hsl(var(--lp-muted))]/10">
          {p.imageUrl && <img src={p.imageUrl} alt={p.name} loading="lazy" width={480} height={600} className="h-full w-full object-cover" />}
        </div>
        <h3 className="font-bold">{p.name}</h3>
        {p.shortDescription && <p className="mt-1 line-clamp-2 text-sm text-[color:hsl(var(--lp-muted))]">{p.shortDescription}</p>}
        {p.priceLabel && <span className="mt-2 block font-bold">{p.priceLabel}</span>}
      </button>
      <button type="button" onClick={() => setOrder(true)} className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">{t(p.ctaKey)}</button>
      {popup && <ItemDetailPopup {...p} onOrder={() => { setPopup(false); setOrder(true); }} onClose={() => setPopup(false)} />}
      {order && <OrderModal item={{ kind: p.kind, id: p.id, name: p.name, basePrice: p.basePrice }} onClose={() => setOrder(false)} />}
    </GlassCard>
  );
}
