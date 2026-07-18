import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { PO_STATUS } from "@fieldops/presentation/PurchaseOrdersTable";
import type { PurchaseOrder, POStatus } from "@fieldops/domain/purchase-order.types";

// FIX5 — detalle de orden: items + acciones según estado (ordenar/cancelar/recibir).
export function PurchaseOrderDetail({ order, onStatus, onReceive, onClose }: {
  order: PurchaseOrder; onStatus: (s: POStatus) => void; onReceive: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const st = order.status;
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="flex flex-wrap items-center gap-2 font-display text-lg font-bold text-foreground">PO-{order.orderNumber} · {order.supplierName}
          <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${PO_STATUS[st].cls}`}>{t(PO_STATUS[st].key)}</span></h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground"><tr><th className="text-left">{t("itemName")}</th><th className="text-right">{t("orderedQty")}</th><th className="text-right">{t("receivedQty")}</th><th className="text-right">{t("subtotal")}</th></tr></thead>
          <tbody>{order.items.map((it) => (<tr key={it.id} className="border-t border-border"><td className="py-1">{it.itemName}</td><td className="py-1 text-right">{it.quantity}</td><td className="py-1 text-right">{it.receivedQty}</td><td className="py-1 text-right">{formatCurrency(it.quantity * it.unitCost)}</td></tr>))}</tbody>
        </table></div>
        <p className="text-right font-bold">{t("total")}: {formatCurrency(order.totalCost)}</p>
        {order.notes && <p className="text-sm text-muted-foreground">{order.notes}</p>}
        <div className="flex flex-wrap gap-2">
          {st === "draft" && <>
            <button type="button" onClick={() => onStatus("ordered")} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("markOrdered")}</button>
            <button type="button" onClick={() => onStatus("cancelled")} className="rounded-lg bg-destructive px-3 py-2 text-sm font-bold text-white">{t("poCancelled")}</button></>}
          {(st === "ordered" || st === "partial") && <button type="button" onClick={onReceive} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{st === "partial" ? t("receiveRemaining") : t("receiveGoods")}</button>}
        </div>
      </div>
    </ScreenModal>
  );
}
