import { useI18n } from "@shared/i18n";
import { money } from "@orders/presentation/order-status.const";
import type { Order } from "@orders/domain/order.types";

export function OrderItemsList({ order }: { order: Order }) {
  const { t } = useI18n();
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("ordItemsTitle")}</h2>
      <ul className="divide-y divide-border">
        {order.items.map((it, i) => (
          <li key={i} className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-foreground">{it.name || "—"}</span>
            <span className="shrink-0 text-muted-foreground">{it.qty} × {money(it.price, order.currency)}</span>
          </li>
        ))}
        {order.items.length === 0 && <li className="py-2 text-sm text-muted-foreground">—</li>}
      </ul>
    </section>
  );
}
