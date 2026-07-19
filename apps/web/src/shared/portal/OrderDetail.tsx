import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { OrderTimeline } from "@shared/portal/OrderTimeline";
import { isDead, STATUS_LABEL } from "@shared/portal/order-status";
import type { CustomerOrder } from "@shared/portal/order.types";

// Detalle de orden: timeline + ítems + total + acciones (confirmar pago ATH / cancelar) según estado.
export function OrderDetail({ order, onClose, onConfirm, onCancel, onReorder }: {
  order: CustomerOrder; onClose: () => void; onConfirm: (id: string) => void; onCancel: (id: string) => void; onReorder: (id: string) => void;
}) {
  const { t } = useI18n();
  const canPay = order.status === "pending" || order.status === "awaiting_payment";
  const canReorder = order.status === "paid" || isDead(order.status);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{order.orderNumber || "—"}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        {isDead(order.status) ? <p className="font-bold text-destructive">{t(STATUS_LABEL[order.status] ?? "osCanceled")}</p> : <OrderTimeline status={order.status} />}
        <div className="space-y-1">{order.items.map((it, i) => (<div key={i} className="flex justify-between text-sm"><span>{it.qty}× {it.name}</span><span>{formatCurrency(it.price * it.qty)}</span></div>))}</div>
        <div className="flex justify-between border-t border-border pt-2 font-bold"><span>{t("pTotal")}</span><span>{formatCurrency(order.total)}</span></div>
        {canPay && (
          <div className="flex gap-2">
            <button type="button" onClick={() => onConfirm(order.id)} className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("pConfirmPayment")}</button>
            <button type="button" onClick={() => onCancel(order.id)} className="rounded-lg bg-secondary text-foreground px-3 py-2 text-sm">{t("pCancelOrder")}</button>
          </div>
        )}
        {canReorder && <button type="button" onClick={() => onReorder(order.id)} className="w-full rounded-lg bg-secondary text-foreground px-3 py-2 text-sm font-bold">{t("pReorder")}</button>}
      </div>
    </ScreenModal>
  );
}
