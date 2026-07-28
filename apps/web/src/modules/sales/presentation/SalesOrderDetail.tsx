import { X, Check, Ban, FileOutput, Truck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { LinkedCustomerBadge } from "@shared/components/LinkedCustomerBadge";
import { SO_ST_KEY, SO_ST_COLOR } from "@sales/presentation/sales-order-ui";
import type { SalesOrder } from "@sales/domain/sales-order.types";

// Detalle del SO: items con ordenado/despachado/facturado/pendiente/backorder + acciones por estado.
export function SalesOrderDetail({ order, canManage, onConfirm, onCreateDelivery, onInvoice, onCancel, onClose }: {
  order: SalesOrder; canManage: boolean; onConfirm: () => void; onCreateDelivery: () => void; onInvoice: () => void; onCancel: () => void; onClose: () => void;
}) {
  const { t } = useI18n(); const o = order;
  const btn = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold";
  const num = "p-1 text-right";
  const canShip = ["confirmed", "partially_shipped"].includes(o.status);
  const canInvoice = ["confirmed", "partially_shipped", "shipped", "partially_invoiced"].includes(o.status);
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{o.customerName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{o.orderNumber}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${SO_ST_COLOR[o.status]}`}>{t(SO_ST_KEY[o.status])}</span>
          {o.quoteNumber && <span className="text-xs text-muted-foreground">← {o.quoteNumber}</span>}
        </div>
        <LinkedCustomerBadge customerId={o.customerId} name={o.customerName} className="text-sm" />
        {o.deliveryDate && <p className="text-sm"><span className="font-bold">{t("deliveryDate")}: </span>{o.deliveryDate}</p>}
        <div className="overflow-x-auto"><table className="w-full text-xs">
          <thead><tr className="border-b border-border text-muted-foreground">
            <th className="p-1 text-left font-medium">{t("description")}</th><th className={num}>{t("qtyOrdered")}</th><th className={num}>{t("qtyShipped")}</th>
            <th className={num}>{t("qtyInvoiced")}</th><th className={num}>{t("qtyPending")}</th><th className={num}>{t("qtyBackordered")}</th><th className={num}>{t("total")}</th></tr></thead>
          <tbody>{o.items.map((i) => { const pend = i.qtyOrdered - i.qtyShipped; return (
            <tr key={i.id} className="border-b border-border">
              <td className="p-1">{i.description}</td><td className={num}>{i.qtyOrdered}</td>
              <td className={`${num} ${i.qtyShipped >= i.qtyOrdered ? "text-green-600" : ""}`}>{i.qtyShipped}</td>
              <td className={`${num} ${i.qtyInvoiced >= i.qtyOrdered ? "text-emerald-600" : ""}`}>{i.qtyInvoiced}</td>
              <td className={`${num} ${pend > 0 ? "text-amber-600" : ""}`}>{pend}</td>
              <td className={`${num} ${i.qtyBackordered > 0 ? "text-destructive" : ""}`}>{i.qtyBackordered || "—"}</td>
              <td className={num}>{formatCurrency(i.total)}</td></tr>); })}</tbody>
        </table></div>
        <div className="flex justify-between px-1 text-sm font-bold text-foreground"><span>{t("total")}</span><span>{formatCurrency(o.total)}</span></div>
        {canManage && <div className="flex flex-wrap gap-2">
          {o.status === "draft" && <button type="button" onClick={onConfirm} className={`${btn} bg-primary text-primary-foreground`}><Check className="h-4 w-4" /> {t("confirmOrder")}</button>}
          {canShip && <button type="button" onClick={onCreateDelivery} className={`${btn} bg-primary text-primary-foreground`}><Truck className="h-4 w-4" /> {t("createDeliveryNote")}</button>}
          {canInvoice && <button type="button" onClick={onInvoice} className={`${btn} bg-secondary`}><FileOutput className="h-4 w-4" /> {t("createInvoice")}</button>}
          {["draft", "confirmed"].includes(o.status) && <button type="button" onClick={onCancel} className={`${btn} bg-destructive text-white`}><Ban className="h-4 w-4" /> {t("cancelOrder")}</button>}
        </div>}
      </div>
    </ScreenModal>
  );
}
