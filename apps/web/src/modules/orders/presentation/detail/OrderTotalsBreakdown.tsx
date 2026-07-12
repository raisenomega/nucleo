import { useI18n } from "@shared/i18n";
import { money } from "@orders/presentation/order-status.const";
import type { Order } from "@orders/domain/order.types";

export function OrderTotalsBreakdown({ order }: { order: Order }) {
  const { t } = useI18n();
  const c = order.currency;
  const line = (label: string, val: number, neg?: boolean) => (
    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{neg && val > 0 ? "−" : ""}{money(val, c)}</span></div>
  );
  return (
    <section className="rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        {line(t("ordTotSubtotal"), order.subtotal)}
        {order.tax > 0 && line(t("ordTotTax"), order.tax)}
        {order.shipping > 0 && line(t("ordTotShipping"), order.shipping)}
        {order.discount > 0 && line(t("ordTotDiscount"), order.discount, true)}
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-foreground">
          <span>{t("ordTotTotal")}</span><span>{money(order.total, c)}</span>
        </div>
      </div>
    </section>
  );
}
