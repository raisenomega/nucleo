import { OrderStatusBadge } from "@orders/presentation/list/OrderStatusBadge";
import { money } from "@orders/presentation/order-status.const";
import type { Order } from "@orders/domain/order.types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

export function OrdersMobileList({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  return (
    <ul className="space-y-2 md:hidden">
      {orders.map((o) => (
        <li key={o.id}>
          <button type="button" onClick={() => onOpen(o.id)} className="w-full rounded-lg border border-border p-3 text-left hover:bg-secondary">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium text-foreground">{o.orderNumber ?? "—"}</span>
              <OrderStatusBadge status={o.status} />
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">{o.customerName || "—"}</div>
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>{fmtDate(o.createdAt)}</span>
              <span className="font-semibold text-foreground">{money(o.total, o.currency)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
