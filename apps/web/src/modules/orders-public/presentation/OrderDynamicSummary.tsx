import { useI18n } from "@shared/i18n";
import type { Totals } from "@orders-public/presentation/useOrderPricing.hook";

const money = (n: number) => `$${n.toFixed(2)}`;

// "Resumen del Pedido" server-authoritative (usa los totals de _public_preview_price). footer = disclaimer recurrente.
export function OrderDynamicSummary({ totals, footer, title }: { totals: Totals; footer: string | null; title: string }) {
  const { t } = useI18n();
  const line = (l: string, val: number) => (
    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{l}</span><span className="text-foreground">{money(val)}</span></div>
  );
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
      <p className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">{title}</p>
      <div className="space-y-1.5">
        {line(t("opSubtotal"), totals.subtotal)}
        {totals.tax > 0 && line(t("opTax"), totals.tax)}
        {totals.shipping > 0 && line(t("opShipping"), totals.shipping)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-bold uppercase text-foreground">{t("opTotal")}</span>
        <span className="text-2xl font-extrabold text-foreground">{money(totals.total)}</span>
      </div>
      {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}
