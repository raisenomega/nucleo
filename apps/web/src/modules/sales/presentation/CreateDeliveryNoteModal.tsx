import { useState } from "react";
import { Truck } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { SalesOrder } from "@sales/domain/sales-order.types";
import type { DnInput, DnResult } from "@sales/domain/delivery-note.types";

type Sel = Record<string, { include: boolean; qty: number }>;

// Crea un conduce con los items PENDIENTES del SO (despacho parcial). El almacén se hereda del item del SO.
export function CreateDeliveryNoteModal({ order, onCreate, onClose }: {
  order: SalesOrder; onCreate: (d: DnInput) => Promise<DnResult>; onClose: () => void;
}) {
  const { t } = useI18n();
  const pending = order.items.map((i) => ({ ...i, pend: i.qtyOrdered - i.qtyShipped })).filter((i) => i.itemId && i.pend > 0);
  const [sel, setSel] = useState<Sel>(Object.fromEntries(pending.map((i) => [i.id, { include: true, qty: i.pend }])));
  const [notes, setNotes] = useState(""); const [busy, setBusy] = useState(false);
  async function submit() {
    const items = pending.map((i) => ({ i, s: sel[i.id] })).filter((x) => x.s?.include && x.s.qty > 0)
      .map((x) => ({ soItemId: x.i.id, qtyDispatched: Math.min(x.s?.qty ?? 0, x.i.pend), warehouseId: x.i.warehouseId }));
    if (!items.length) { window.alert(t("selectItems")); return; }
    setBusy(true);
    const r = await onCreate({ salesOrderId: order.id, items, shippingNotes: notes, notes: "" });
    setBusy(false); if (!r.ok) window.alert(r.error); else onClose();
  }
  const inp = "w-16 rounded border border-border bg-background p-1 text-right text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /><h2 className="font-display text-lg font-bold">{t("createDeliveryNote")} — {order.orderNumber}</h2></div>
        <p className="text-xs text-muted-foreground">{t("pendingItems")}</p>
        {pending.length === 0 && <p className="text-sm text-muted-foreground">{t("noPendingItems")}</p>}
        {pending.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
            <input type="checkbox" checked={sel[i.id]?.include ?? false} onChange={(e) => setSel((s) => ({ ...s, [i.id]: { include: e.target.checked, qty: s[i.id]?.qty ?? i.pend } }))} />
            <div className="flex-1"><p className="text-sm font-semibold">{i.description}</p><p className="text-xs text-muted-foreground">{t("qtyPending")}: {i.pend}</p></div>
            <input type="number" value={sel[i.id]?.qty || ""} max={i.pend} min={0}
              onChange={(e) => setSel((s) => ({ ...s, [i.id]: { include: s[i.id]?.include ?? true, qty: Number(e.target.value) } }))} className={inp} />
          </div>))}
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("shippingNotes")} className="w-full rounded-lg border border-border bg-background p-2 text-sm" rows={2} />
        <div className="flex gap-2">
          <button type="button" disabled={busy || pending.length === 0} onClick={() => void submit()} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold disabled:opacity-50">{t("createDeliveryNote")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm">{t("cancel")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
