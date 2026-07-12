import { useI18n } from "@shared/i18n";
import type { Order } from "@orders/domain/order.types";

export function OrderCustomerInfo({ order }: { order: Order }) {
  const { t } = useI18n();
  const row = (label: string, val: string) => val
    ? <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right text-foreground">{val}</span></div> : null;
  const utm = [order.utmSource, order.utmMedium, order.utmCampaign].filter(Boolean).join(" · ");
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("ordCustomerTitle")}</h2>
      <div className="space-y-1.5">
        {row(t("ordColCustomer"), order.customerName || "—")}
        {row(t("publicEmail"), order.customerEmail)}
        {row(t("publicPhone"), order.customerPhone)}
      </div>
      {(order.sourceHostname || utm) && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          {t("ordSource")}: {order.sourceHostname || "—"}{utm && ` · ${utm}`}
        </p>
      )}
    </section>
  );
}
