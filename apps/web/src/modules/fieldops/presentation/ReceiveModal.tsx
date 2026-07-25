import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PurchaseOrder, ReceiveLine } from "@fieldops/domain/purchase-order.types";

// FIX6 — recibir mercancía (parcial). Gap#7: por línea con trazabilidad se captura lote/serie + caducidad.
export function ReceiveModal({ order, onSubmit, onClose }: {
  order: PurchaseOrder; onSubmit: (items: ReceiveLine[]) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const pending = (i: PurchaseOrder["items"][number]) => Math.max(0, i.quantity - i.receivedQty);
  const cap = (i: PurchaseOrder["items"][number]) => (i.trackingType === "serial" ? Math.min(1, pending(i)) : pending(i));
  const [qty, setQty] = useState<Record<string, number>>(Object.fromEntries(order.items.map((i) => [i.itemId, cap(i)])));
  const [lotN, setLotN] = useState<Record<string, string>>({});
  const [exp, setExp] = useState<Record<string, string>>({});
  const suggest = `LOT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;
  const fld = "rounded border border-border bg-background p-1 text-sm";
  const submit = () => onSubmit(order.items.map((i) => ({ itemId: i.itemId, receivedQty: qty[i.itemId] ?? 0,
    lotNumber: i.trackingType !== "none" ? (lotN[i.itemId]?.trim() || suggest) : undefined,
    expiryDate: i.trackingType === "lot" ? (exp[i.itemId] || undefined) : undefined })).filter((x) => x.receivedQty > 0));
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("receiveGoods")} · PO-{order.orderNumber}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {order.items.map((i) => (
          <div key={i.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex-1 text-sm">{i.itemName} <span className="text-muted-foreground">({i.receivedQty}/{i.quantity})</span></span>
              <input type="number" min="0" max={cap(i)} value={qty[i.itemId] ?? 0} onChange={(e) => setQty((c) => ({ ...c, [i.itemId]: Number(e.target.value) }))} className={`w-24 ${fld} p-2`} />
            </div>
            {i.trackingType !== "none" && <div className="flex gap-2 pl-2">
              <input value={lotN[i.itemId] ?? ""} onChange={(e) => setLotN((c) => ({ ...c, [i.itemId]: e.target.value }))} placeholder={i.trackingType === "serial" ? t("serialNumber") : t("lotNumber")} className={`flex-1 ${fld}`} />
              {i.trackingType === "lot" && <input type="date" value={exp[i.itemId] ?? ""} onChange={(e) => setExp((c) => ({ ...c, [i.itemId]: e.target.value }))} className={fld} />}
            </div>}
          </div>
        ))}
        <button type="button" onClick={submit} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("receiveGoods")}</button>
      </div>
    </ScreenModal>
  );
}
