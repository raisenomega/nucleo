import { Plus, Trash2, Boxes } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { ProductSelect, type PickedProduct } from "@shared/components/ProductSelect";
import type { InvoiceItem } from "@billing/domain/invoice.types";

const NEW: InvoiceItem = { description: "", quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0, lineTotal: 0 };
const line = (m: InvoiceItem) => m.quantity * m.unitPrice * (1 - m.discountPct / 100) * (1 + m.taxPct / 100);

export function InvoiceItemsEditor({ items, onChange }: {
  items: readonly InvoiceItem[]; onChange: (items: InvoiceItem[]) => void;
}) {
  const { t } = useI18n();
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const inp = "w-full rounded border border-border bg-background p-1 text-sm";
  function set(idx: number, k: keyof InvoiceItem, v: string) {
    onChange(items.map((it, i) => {
      if (i !== idx) return it;
      const m = { ...it, [k]: k === "description" ? v : Number(v) } as InvoiceItem;
      return { ...m, lineTotal: line(m) };
    }));
  }
  const addProduct = (p: PickedProduct) => {
    const m: InvoiceItem = { description: p.name, quantity: 1, unitPrice: p.price, taxPct: 0, discountPct: 0, lineTotal: 0, productId: p.id, sku: p.sku };
    onChange([...items, { ...m, lineTotal: line(m) }]);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{t("items")}</span>
        <button type="button" onClick={() => onChange([...items, NEW])}
          className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-body"><Plus className="h-3 w-3" /> {t("addItem")}</button>
      </div>
      <ProductSelect onPick={addProduct} />
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 items-center gap-1">
          <div className="col-span-4">
            {it.productId && <span className="mb-0.5 inline-flex items-center gap-1 rounded bg-green-500/10 px-1 text-[10px] font-bold text-green-600"><Boxes className="h-3 w-3" />{it.sku || "Producto"}</span>}
            <input value={it.description} onChange={(e) => set(idx, "description", e.target.value)} placeholder={t("description")} className={inp} />
          </div>
          <input type="number" value={it.quantity || ""} onChange={(e) => set(idx, "quantity", e.target.value)} placeholder={t("quantity")} className={`${inp} col-span-2`} />
          <input type="number" value={it.unitPrice || ""} onChange={(e) => set(idx, "unitPrice", e.target.value)} placeholder={t("unitPrice")} className={`${inp} col-span-2`} />
          <input type="number" value={it.taxPct || ""} onChange={(e) => set(idx, "taxPct", e.target.value)} placeholder={t("taxPct")} className={`${inp} col-span-1`} />
          <input type="number" value={it.discountPct || ""} onChange={(e) => set(idx, "discountPct", e.target.value)} placeholder={t("discountPct")} className={`${inp} col-span-1`} />
          <span className="col-span-1 text-right text-xs font-semibold">{formatCurrency(it.lineTotal)}</span>
          <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} className="col-span-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="text-right font-body text-sm font-bold text-foreground">{t("grandTotal")}: {formatCurrency(total)}</div>
    </div>
  );
}
