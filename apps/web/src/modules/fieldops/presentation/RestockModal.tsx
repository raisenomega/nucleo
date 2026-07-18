import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { InventoryItem, RestockData } from "@fieldops/domain/inventory.types";
import type { SupplierRef } from "@fieldops/domain/supplier.types";

const today = () => new Date().toISOString().slice(0, 10);

// Reposición de inventario: entrada con cantidad/costo/proveedor/fecha → RPC record_restock (avg ponderado + gasto auto).
export function RestockModal({ item, suppliers, onSubmit, onClose }: {
  item: InventoryItem; suppliers: readonly SupplierRef[]; onSubmit: (d: RestockData) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<RestockData>({ quantity: 1, unitCost: item.unitCost || 0, supplier: item.supplierName, supplierId: item.supplierId, notes: "", date: today() });
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (f.quantity < 1 || f.unitCost <= 0) return; onSubmit(f); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("restock")} · {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <label className="space-y-1"><span className={lbl}>{t("quantity")}</span>
          <input type="number" min="1" step="1" value={f.quantity || ""} onChange={(e) => setF({ ...f, quantity: Number(e.target.value) })} className={field} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("unitCost")}</span>
          <input type="number" min="0.01" step="0.01" value={f.unitCost || ""} onChange={(e) => setF({ ...f, unitCost: Number(e.target.value) })} className={field} required /></label>
        <label className="space-y-1"><span className={lbl}>{t("supplier")}</span>
          <select value={f.supplierId ?? ""} onChange={(e) => { const s = suppliers.find((x) => x.id === e.target.value); setF({ ...f, supplierId: e.target.value || null, supplier: s?.name ?? "" }); }} className={field}>
            <option value="">— {t("unlinked")} —</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
        <label className="space-y-1"><span className={lbl}>{t("date")}</span>
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={field} /></label>
        <label className="space-y-1 md:col-span-2"><span className={lbl}>{t("notes")}</span>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={2} className={field} /></label>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("registerEntry")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
