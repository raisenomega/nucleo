import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { InventoryItem, TransferData } from "@fieldops/domain/inventory.types";

// FIX7 — transferir stock a otra ubicación (no cambia stock total). Muestra ubicación actual como referencia.
export function TransferModal({ item, onSubmit, onClose }: {
  item: InventoryItem; onSubmit: (d: TransferData) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [f, setF] = useState<TransferData>({ qty: item.stock, zone: item.warehouseZone, aisle: item.aisle, shelf: item.shelf, bin: item.bin, notes: "" });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const lbl = "text-xs font-bold text-muted-foreground";
  const cur = [item.warehouseZone, item.aisle, item.shelf, item.bin].filter(Boolean).join(" · ") || "—";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (f.qty <= 0) return; onSubmit(f); };
  const txt = (k: "zone" | "aisle" | "shelf" | "bin", label: string) => (
    <label className="space-y-1"><span className={lbl}>{label}</span><input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={fld} /></label>
  );
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("transfer")} · {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
        <p className="text-sm text-muted-foreground md:col-span-2">{t("currentLocation")}: {cur}</p>
        <label className="space-y-1"><span className={lbl}>{t("quantity")}</span><input type="number" min="1" value={f.qty || ""} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })} className={fld} required /></label>
        <p className="text-xs font-bold uppercase text-muted-foreground md:col-span-2">{t("destination")}</p>
        {txt("zone", t("warehouseZone"))}{txt("aisle", t("aisle"))}{txt("shelf", t("shelf"))}{txt("bin", t("bin"))}
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
