import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { Spinner } from "@shared/components/loading/Spinner";
import { useItemDetail } from "@landing-public/presentation/useItemDetail.hook";
import { ItemGalleryCarousel } from "@landing-public/presentation/popup/ItemGalleryCarousel";
import { ItemHighlightsChecklist } from "@landing-public/presentation/popup/ItemHighlightsChecklist";
import { ItemDescriptionBlock } from "@landing-public/presentation/popup/ItemDescriptionBlock";
import type { CardItemProps } from "@landing-public/presentation/cards/ItemCardVertical";

const bar = "sticky z-10 border-border bg-card/85 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/70";

// Popup de detalle: carrusel (izq) + precio/descripción/checklist (der) + CTA sticky que salta al OrderModal.
export function ItemDetailPopup({ onOrder, onClose, ...p }: CardItemProps & { onOrder: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const { detail, loading } = useItemDetail(p.kind, p.slug, true);
  const gallery = detail?.gallery.length ? detail.gallery : p.imageUrl ? [p.imageUrl] : [];
  return (
    <ScreenModal onClose={onClose}>
      <div className={`${bar} top-0 flex items-center justify-between border-b`}>
        <h2 className="hidden font-display text-lg font-bold text-foreground md:block">{p.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <ItemGalleryCarousel images={gallery} alt={p.name} />
        <div className="space-y-3">
          <span className="block text-lg font-bold text-foreground">{p.priceLabel}</span>
          {loading && !detail && <div className="py-4"><Spinner /></div>}
          {detail && <ItemDescriptionBlock text={detail.longDescription} />}
          {detail && <ItemHighlightsChecklist highlights={detail.highlights} />}
        </div>
      </div>
      <div className={`${bar} bottom-0 border-t`}>
        <button type="button" onClick={onOrder} className="w-full rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground">{t(p.ctaKey)}</button>
      </div>
    </ScreenModal>
  );
}
