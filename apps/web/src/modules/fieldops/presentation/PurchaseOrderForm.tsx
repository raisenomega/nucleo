import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { POCreateData, POLine } from "@fieldops/domain/purchase-order.types";
import type { InventoryItem } from "@fieldops/domain/inventory.types";
import type { SupplierRef } from "@fieldops/domain/supplier.types";

// FIX4 — crear orden de compra: proveedor + líneas de item + fecha/notas. Guardar borrador u ordenada.
export function PurchaseOrderForm({ suppliers, items, initialSupplier, initialLines, onSubmit, onClose }: {
  suppliers: readonly SupplierRef[]; items: readonly InventoryItem[]; initialSupplier: string | null; initialLines: POLine[];
  onSubmit: (d: POCreateData) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [supplierId, setSupplierId] = useState<string | null>(initialSupplier);
  const [lines, setLines] = useState<POLine[]>(initialLines);
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const total = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const addLine = () => setLines((c) => [...c, { itemId: items[0]?.id ?? "", quantity: 1, unitCost: items[0]?.unitCost ?? 0 }]);
  const setLine = (i: number, p: Partial<POLine>) => setLines((c) => c.map((l, k) => (k === i ? { ...l, ...p } : l)));
  const submit = (markOrdered: boolean) => { const ls = lines.filter((l) => l.itemId && l.quantity > 0); if (!ls.length) return; onSubmit({ supplierId, expectedAt, notes, lines: ls, markOrdered }); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("newPurchaseOrder")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-3 p-4">
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("supplier")}</span>
          <select value={supplierId ?? ""} onChange={(e) => setSupplierId(e.target.value || null)} className={`w-full ${fld}`}><option value="">—</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <select value={l.itemId} onChange={(e) => { const it = items.find((x) => x.id === e.target.value); setLine(i, { itemId: e.target.value, unitCost: it?.unitCost ?? l.unitCost }); }} className={`min-w-0 flex-1 ${fld}`}>{items.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
            <input type="number" min="1" value={l.quantity || ""} onChange={(e) => setLine(i, { quantity: Number(e.target.value) })} className={`w-16 ${fld}`} />
            <input type="number" min="0" step="0.01" value={l.unitCost || ""} onChange={(e) => setLine(i, { unitCost: Number(e.target.value) })} className={`w-20 ${fld}`} />
            <button type="button" onClick={() => setLines((c) => c.filter((_, k) => k !== i))} aria-label={t("delete")} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button type="button" onClick={addLine} className="flex items-center gap-1 text-sm font-bold text-primary"><Plus className="h-4 w-4" /> {t("addItem")}</button>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("expectedDate")}</span><input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} className={`w-full ${fld}`} /></label>
          <label className="space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("notes")}</span><input value={notes} onChange={(e) => setNotes(e.target.value)} className={`w-full ${fld}`} /></label>
        </div>
        <p className="text-right font-bold">{t("total")}: {formatCurrency(total)}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => submit(false)} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body font-bold">{t("poDraft")}</button>
          <button type="button" onClick={() => submit(true)} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("markOrdered")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
