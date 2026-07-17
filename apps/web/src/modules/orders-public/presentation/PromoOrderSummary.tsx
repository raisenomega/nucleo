import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PromoHeaderCtx } from "@orders-public/presentation/PromoOrderHeader";

const money = (n: number) => `$${n.toFixed(2)}`;

// Resumen del pedido estilo legacy (Primer mes … $X / Incluido / TOTAL HOY / nota recurrente) + link a términos
// (modal). Todos los textos vienen de promo_offer (editables). El total es el server-autoritativo (first-cycle).
export function PromoOrderSummary({ promo, total }: { promo: PromoHeaderCtx; total: number }) {
  const { t } = useI18n();
  const [terms, setTerms] = useState(false);
  return (
    <div className="space-y-2">
      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{t("opSummaryTitle")}</p>
        {promo.summaryLine && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{promo.summaryLine}</span><span className="font-semibold text-foreground">{money(total)}</span></div>}
        {promo.includedLine && <div className="mt-1 flex justify-between text-sm"><span className="text-muted-foreground">{promo.includedLine}</span><span className="font-medium text-green-600">{promo.includedLabel || t("promoIncluded")}</span></div>}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-bold uppercase text-foreground">{promo.totalLabel || t("promoTotalToday")}</span>
          <span className="text-2xl font-extrabold text-foreground">{money(total)}</span>
        </div>
        {promo.recurringNote && <p className="mt-2 text-xs text-muted-foreground">{promo.recurringNote}</p>}
      </div>
      {promo.termsText && <p className="text-center text-xs text-muted-foreground">{t("promoAcceptPrefix")}{" "}
        <button type="button" onClick={() => setTerms(true)} className="font-medium text-foreground underline">{promo.termsLabel || t("promoTermsDefault")}</button></p>}
      {terms && (
        <ScreenModal onClose={() => setTerms(false)}>
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-display text-lg font-bold text-foreground">{promo.termsLabel || t("promoTermsDefault")}</h2>
            <button type="button" onClick={() => setTerms(false)} aria-label={t("opClose")}><X className="h-6 w-6" /></button>
          </div>
          <div className="whitespace-pre-wrap p-4 text-sm text-muted-foreground">{promo.termsText}</div>
        </ScreenModal>
      )}
    </div>
  );
}
