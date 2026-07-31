import { useI18n } from "@shared/i18n";
import { OrderDynamicSummary } from "@orders-public/presentation/OrderDynamicSummary";
import { OrderTotalPreview } from "@orders-public/presentation/OrderTotalPreview";
import { PromoOrderSummary } from "@orders-public/presentation/PromoOrderSummary";
import type { PromoHeaderCtx } from "@orders-public/presentation/PromoOrderHeader";
import type { Totals } from "@orders-public/presentation/useOrderPricing.hook";
import type { OrderForm } from "@orders-public/domain/order-form.types";

const bar = "sticky bottom-0 z-10 space-y-3 border-t border-border bg-card/85 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/70";

// Barra inferior del modal de orden: resumen del total + botones cancelar/enviar.
// El botón muestra "Pagar con tarjeta" (Stripe) o el label del form (flujo legacy).
export function OrderSubmitBar({ form, totals, promoContext, busy, redirecting, useStripe, isSub, pm, locale, blocked, onSubmit, onClose }: {
  form: OrderForm; totals: Totals; promoContext?: PromoHeaderCtx; busy: boolean; redirecting: boolean;
  useStripe: boolean; isSub: boolean; pm: string; locale: string; blocked?: boolean; onSubmit: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const submitLabel = useStripe ? (isSub ? t("subscribeCard") : t("payWithCard")) : (locale === "en" ? form.submitLabelEn : form.submitLabelEs) || t("opSubmit");
  return (
    <div className={bar}>
      {promoContext?.summaryLine ? <PromoOrderSummary promo={promoContext} total={totals.total} />
        : form.showSummary ? <OrderDynamicSummary totals={totals} title={t("opSummaryTitle")} footer={locale === "en" ? form.summaryFooterEn : form.summaryFooterEs} recurring={isSub ? totals.total : null} />
        : <OrderTotalPreview totals={totals} />}
      <div className="flex gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-3 font-bold text-foreground">{(locale === "en" ? form.cancelLabelEn : form.cancelLabelEs) || t("opCancel")}</button>
        <button type="button" disabled={busy || redirecting || blocked || (!useStripe && !pm)} onClick={onSubmit} className="flex-1 rounded-lg bg-primary px-4 py-3 font-bold text-primary-foreground disabled:opacity-50">
          {redirecting ? t("payProcessing") : busy ? t("opSubmitting") : submitLabel}
        </button>
      </div>
    </div>
  );
}
