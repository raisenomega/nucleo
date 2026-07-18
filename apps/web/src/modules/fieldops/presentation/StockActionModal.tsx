import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { InventoryItem } from "@fieldops/domain/inventory.types";

// FIX6 — ajuste (fija nueva cantidad → 'ajuste') o merma (cantidad perdida → 'merma'). Un solo modal por mode.
export function StockActionModal({ item, mode, onSubmit, onClose }: {
  item: InventoryItem; mode: "adjust" | "shrink"; onSubmit: (qty: number, reason: string) => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const [qty, setQty] = useState(mode === "adjust" ? item.stock : 0);
  const [reason, setReason] = useState("");
  const field = "w-full rounded-lg border border-border bg-background p-2 font-body";
  const lbl = "text-xs font-bold text-muted-foreground";
  const go = (e: React.FormEvent) => { e.preventDefault(); if (mode === "shrink" && qty <= 0) return; onSubmit(qty, reason); };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{t(mode === "adjust" ? "adjustStock" : "registerShrinkage")} · {item.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <form onSubmit={go} className="space-y-3 p-4">
        <label className="block space-y-1"><span className={lbl}>{t(mode === "adjust" ? "newQuantity" : "lostQuantity")}</span>
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
