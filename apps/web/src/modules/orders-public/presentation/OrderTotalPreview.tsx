import { useI18n } from "@shared/i18n";

const money = (n: number) => `$${n.toFixed(2)}`;

export function OrderTotalPreview({ totals }: { totals: { subtotal: number; tax: number; shipping: number; total: number; discount?: number } }) {
  const { t } = useI18n();
  const disc = totals.discount ?? 0;
  const line = (label: string, val: number) => (
    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="text-foreground">{money(val)}</span></div>
  );
  return (
    <div className="space-y-1 rounded-lg border border-border p-3">
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("opSubtotal")}</span>
        <span className={disc > 0 ? "text-muted-foreground line-through" : "text-foreground"}>{money(totals.subtotal)}</span></div>
      {disc > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("opDiscount")}</span><span className="font-medium text-green-600">−{money(disc)}</span></div>}
      {totals.tax > 0 && line(t("opTax"), totals.tax)}
      {totals.shipping > 0 && line(t("opShipping"), totals.shipping)}
      <div className="flex justify-between border-t border-border pt-1 text-base font-bold text-foreground">
        <span>{t("opTotal")}</span><span>{money(totals.total)}</span>
      </div>
    </div>
  );
}
