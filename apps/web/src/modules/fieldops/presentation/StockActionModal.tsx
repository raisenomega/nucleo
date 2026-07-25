import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { WarehousePicker } from "@fieldops/presentation/WarehousePicker";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX6 — ajuste (fija nueva cantidad → 'ajuste') o merma (cantidad perdida → 'merma') POR ALMACÉN.
export function StockActionModal({ item, mode, onSubmit, onClose }: {
  item: InventoryItem; mode: "adjust" | "shrink"; onSubmit: (qty: number, reason: string, warehouseId: string | null) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [wh, setWh] = useState("");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const uom = item.unitOfMeasureAbbreviation ? ` (${item.unitOfMeasureAbbreviation})` : "";
  const whStock = item.warehouseStock.find((e) => e.warehouseId === wh)?.quantity ?? 0;
  useEffect(() => { setQty(mode === "adjust" ? whStock : 0); }, [wh]);
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (mode === "shrink" && qty <= 0) return; onSubmit(qty, reason, wh || null); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t(mode === "adjust" ? "adjustStock" : "registerShrinkage")} · {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="space-y-3 p-4">
        <WarehousePicker value={wh} onChange={setWh} hideIfSingle />
        <p className="text-sm text-muted-foreground">{t("stock")}: <b className="text-foreground">{whStock}{uom}</b></p>
        <label className="block space-y-1"><span className={lbl}>{t(mode === "adjust" ? "newQuantity" : "lostQuantity")}{uom}</span>
          <input type="number" min={mode === "shrink" ? "1" : "0"} step="1" value={qty || ""} onChange={(e) => setQty(Number(e.target.value))} className={field} required /></label>
        <label className="block space-y-1"><span className={lbl}>{t("reason")}</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={field} /></label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-body font-bold">{t("save")}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body">{t("cancel")}</button>
        </div>
      </form>
    </ScreenModal>
  );
}
