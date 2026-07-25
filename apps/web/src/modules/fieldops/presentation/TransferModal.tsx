import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { WarehousePicker } from "@fieldops/presentation/WarehousePicker";
import type { InventoryItem, TransferData } from "@fieldops/domain/inventory.types";

// Transferencia REAL entre almacenes (overload 5-arg del backend). Mueve saldo de verdad; el total no cambia.
export function TransferModal({ item, onSubmit, onClose }: { item: InventoryItem; onSubmit: (d: TransferData) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const abbr = item.unitOfMeasureAbbreviation;
  const uom = abbr ? ` ${abbr}` : "";
  const at = (id: string) => item.warehouseStock.find((e) => e.warehouseId === id)?.quantity ?? 0;
  const fromStock = at(from);
  const invalid = !from || !to || from === to || qty <= 0 || qty > fromStock;
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (invalid) return; onSubmit({ qty, fromWarehouseId: from, toWarehouseId: to, notes }); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t("transferBetweenWarehouses")} · {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="space-y-3 p-4">
        <WarehousePicker value={from} onChange={setFrom} label={t("fromWarehouse")} />
        <WarehousePicker value={to} onChange={setTo} label={t("toWarehouse")} exclude={from} />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("stockInOrigin")}: <b className="text-foreground">{fromStock}{uom}</b></span>
          <span>{t("stockInDestination")}: <b className="text-foreground">{at(to)}{uom}</b></span>
        </div>
        <label className="block space-y-1"><span className="text-xs font-bold text-muted-foreground">{t("quantity")}{abbr ? ` (${abbr})` : ""}</span>
          <input type="number" min="1" max={fromStock} value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} className={field} required /></label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t("notes")} className={field} />
        <div className="flex gap-2">
          <button type="submit" disabled={invalid} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold disabled:opacity-50">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
