import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { STATUS_LABEL, statusCls } from "@shared/portal/order-status";
import type { CustomerOrder } from "@shared/portal/order.types";

// Fila de orden en la lista del portal. Click → detalle.
export function OrderCard({ order, onOpen }: { order: CustomerOrder; onOpen: (id: string) => void }) {
  const { t } = useI18n();
  return (
    <button type="button" onClick={() => onOpen(order.id)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left">
      <span>
        <span className="font-bold text-foreground">{order.orderNumber || "—"}</span>
        <span className="block text-xs text-muted-foreground">{order.createdAt.slice(0, 10)}</span>
      </span>
      <span className="text-right">
        <span className="block font-semibold text-foreground">{formatCurrency(order.total)}</span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${statusCls(order.status)}`}>{t(STATUS_LABEL[order.status] ?? "osPending")}</span>
      </span>
    </button>
  );
}
