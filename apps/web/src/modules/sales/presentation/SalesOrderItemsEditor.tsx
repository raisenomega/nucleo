import { Plus, Trash2, Boxes } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { InventoryItemSelect, type PickedItem } from "@shared/components/InventoryItemSelect";
import type { SoLineInput } from "@sales/domain/sales-order.types";

const NEW: SoLineInput = { description: "", qty: 1, unitPrice: 0, discountPct: 0, taxPct: 0 };
const lineTotal = (m: SoLineInput) => m.qty * m.unitPrice * (1 - m.discountPct / 100) * (1 + m.taxPct / 100);

// atp = map itemId→disponible (físico−reservado), para avisar si la cantidad excede el stock.
export function SalesOrderItemsEditor({ items, atp, onChange, onAddItem }: {
  items: readonly SoLineInput[]; atp: Record<string, number>; onChange: (items: SoLineInput[]) => void; onAddItem: (p: PickedItem) => void;
}) {
  const { t } = useI18n();
  const inp = "w-full rounded border border-border bg-background p-1 text-sm";
  function set(idx: number, k: keyof SoLineInput, v: string) {
    onChange(items.map((it, i) => (i === idx ? { ...it, [k]: k === "description" ? v : Number(v) } : it)));
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{t("items")}</span>
        <button type="button" onClick={() => onChange([...items, NEW])} className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs"><Plus className="h-3 w-3" /> {t("addItem")}</button>
      </div>
      <InventoryItemSelect onPick={onAddItem} />
      {items.map((it, idx) => {
        const avail = it.itemId ? atp[it.itemId] : undefined;
        const over = avail !== undefined && it.qty > avail;
        return (
          <div key={idx} className="grid grid-cols-12 items-center gap-1">
            <div className="col-span-4">
              {it.itemId && <span className={`mb-0.5 inline-flex items-center gap-1 rounded px-1 text-[10px] font-bold ${over ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"}`}><Boxes className="h-3 w-3" />{t("available")}: {avail ?? "—"}</span>}
              <input value={it.description} onChange={(e) => set(idx, "description", e.target.value)} placeholder={t("description")} className={inp} />
            </div>
            <input type="number" value={it.qty || ""} onChange={(e) => set(idx, "qty", e.target.value)} placeholder={t("quantity")} className={`${inp} col-span-2 ${over ? "border-destructive" : ""}`} />
            <input type="number" value={it.unitPrice || ""} onChange={(e) => set(idx, "unitPrice", e.target.value)} placeholder={t("unitPrice")} className={`${inp} col-span-2`} />
            <input type="number" value={it.taxPct || ""} onChange={(e) => set(idx, "taxPct", e.target.value)} placeholder={t("taxPct")} className={`${inp} col-span-1`} />
            <input type="number" value={it.discountPct || ""} onChange={(e) => set(idx, "discountPct", e.target.value)} placeholder={t("discountPct")} className={`${inp} col-span-1`} />
            <span className="col-span-1 text-right text-xs font-semibold">{formatCurrency(lineTotal(it))}</span>
            <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} className="col-span-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>);
      })}
    </div>
  );
}
