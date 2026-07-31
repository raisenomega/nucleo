import { motion } from "framer-motion";
import { useI18n } from "@shared/i18n";
import type { Totals } from "@orders-public/presentation/useOrderPricing.hook";

const money = (n: number) => `$${n.toFixed(2)}`;

// "Resumen del Pedido" server-authoritative (usa los totals de _public_preview_price). footer = disclaimer recurrente.
// recurring: si es suscripción, muestra el recurrente DINÁMICO (= total en vivo), sin hardcodes de precio viejos.
// hookPrice: si hay oferta activa, el TOTAL HOY = hook (lo que cobra el ciclo 1) y el recurrente va como "próximo ciclo".
export function OrderDynamicSummary({ totals, footer, title, recurring, hookPrice, offerAccepted }: { totals: Totals; footer: string | null; title: string; recurring?: number | null; hookPrice?: number | null; offerAccepted?: boolean }) {
  const { t, locale } = useI18n();
  const todayTotal = hookPrice != null ? hookPrice : totals.total;
  const glow = hookPrice != null && offerAccepted;  // efecto verde/positivo al aceptar la oferta
  const line = (l: string, val: number) => (
    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="text-foreground">{money(val)}</span></div>
  );
  const unitLabel = locale === "en" ? totals.unitLabelEn : totals.unitLabelEs;
  return (
    <div className={`rounded-lg border-2 bg-primary/5 p-4 transition-all duration-300 ${glow ? "border-green-500/60 shadow-md shadow-green-500/20" : "border-primary/30"}`}>
      <p className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{title}</p>
      <div className="space-y-1.5">
        {line(t("opSubtotal"), totals.subtotal)}
        {totals.unitPrice != null && <p className="-mt-1 text-xs text-muted-foreground">{money(totals.unitPrice)} {unitLabel}</p>}
        {totals.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("opDiscount")}</span><span className="font-medium text-green-600">−{money(totals.discount)}</span></div>}
        {totals.tax > 0 && line(t("opTax"), totals.tax)}
        {totals.shipping > 0 && line(t("opShipping"), totals.shipping)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-bold uppercase text-foreground">{t("opTotal")}</span>
        <motion.span className={`text-2xl font-extrabold ${glow ? "text-green-600" : "text-foreground"}`}
          animate={glow ? { scale: [1, 1.1, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>{money(todayTotal)}</motion.span>
      </div>
      {hookPrice != null && <p className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{t("offNextCycle")}</span><span>{money(totals.total)}</span></p>}
      {recurring != null && <p className="mt-2 text-xs font-medium text-foreground">{t("opRecurringPrefix")} {money(recurring)} {t("opRecurringSuffix")}</p>}
      {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}
