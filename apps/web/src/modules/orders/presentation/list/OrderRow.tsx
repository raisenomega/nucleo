import { useI18n } from "@shared/i18n";
import { OrderStatusBadge } from "@orders/presentation/list/OrderStatusBadge";
import { money } from "@orders/presentation/order-status.const";
import type { Order } from "@orders/domain/order.types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

export function OrderRow({ order, onOpen }: { order: Order; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <tr onClick={() => onOpen(order.id)} className="cursor-pointer border-t border-border hover:bg-secondary">
      <td className="p-3 font-mono text-sm font-medium text-foreground">{order.orderNumber ?? "—"}</td>
      <td className="p-3 text-sm">
        <div className="font-medium text-foreground">{order.customerName || "—"}</div>
        <div className="text-xs text-muted-foreground">{order.customerEmail || order.customerPhone}</div>
      </td>
      <td className="p-3 text-sm font-semibold text-foreground">{money(order.total, order.currency)}</td>
      <td className="p-3"><OrderStatusBadge status={order.status} /></td>
      <td className="p-3 text-xs text-muted-foreground">{t("ordItemsCount", { n: order.items.length })}</td>
      <td className="p-3 text-xs text-muted-foreground">{fmtDate(order.createdAt)}</td>
    </tr>
  );
}
