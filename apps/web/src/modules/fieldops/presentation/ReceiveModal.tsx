import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PurchaseOrder } from "@fieldops/domain/purchase-order.types";

// FIX6 — recibir mercancía (parcial): por item, cantidad recibida (default = pendiente).
export function ReceiveModal({ order, onSubmit, onClose }: {
  order: PurchaseOrder; onSubmit: (items: { itemId: string; receivedQty: number }[]) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const pending = (i: PurchaseOrder["items"][number]) => Math.max(0, i.quantity - i.receivedQty);
  const [qty, setQty] = useState<Record<string, number>>(Object.fromEntries(order.items.map((i) => [i.itemId, pending(i)])));
  const submit = () => onSubmit(order.items.map((i) => ({ itemId: i.itemId, receivedQty: qty[i.itemId] ?? 0 })).filter((x) => x.receivedQty > 0));
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("receiveGoods")} · PO-{order.orderNumber}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        {order.items.map((i) => (
          <div key={i.id} className="flex items-center justify-between gap-2">
            <span className="flex-1 text-sm">{i.itemName} <span className="text-muted-foreground">({i.receivedQty}/{i.quantity})</span></span>
            <input type="number" min="0" max={pending(i)} value={qty[i.itemId] ?? 0} onChange={(e) => setQty((c) => ({ ...c, [i.itemId]: Number(e.target.value) }))} className="w-24 rounded-lg border border-border bg-background p-2 text-sm" />
          </div>
        ))}
        <button type="button" onClick={submit} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("receiveGoods")}</button>
      </div>
    </ScreenModal>
  );
}
