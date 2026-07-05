import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { LeadItem } from "@crm/domain/lead.types";

export function LeadItemsEditor({ items, onChange }: {
  items: readonly LeadItem[]; onChange: (items: LeadItem[]) => void;
}) {
  const { t } = useI18n();
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const inp = "w-full rounded border border-border bg-background p-1 text-sm";
  function set(idx: number, k: keyof LeadItem, v: string) {
    onChange(items.map((it, i) => {
      if (i !== idx) return it;
      const m = { ...it, [k]: k === "description" ? v : Number(v) } as LeadItem;
      return { ...m, lineTotal: m.quantity * m.unitPrice * (1 - m.discountPct / 100) * (1 + m.taxPct / 100) };
    }));
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground">{t("items")}</span>
        <button type="button" onClick={() => onChange([...items, { description: "", quantity: 1, unitPrice: 0, taxPct: 0, discountPct: 0, lineTotal: 0 }])}
          className="flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-body"><Plus className="h-3 w-3" /> {t("addItem")}</button>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 items-center gap-1">
          <input value={it.description} onChange={(e) => set(idx, "description", e.target.value)} placeholder={t("description")} className={`${inp} col-span-4`} />
          <input type="number" value={it.quantity || ""} onChange={(e) => set(idx, "quantity", e.target.value)} placeholder={t("quantity")} className={`${inp} col-span-2`} />
          <input type="number" value={it.unitPrice || ""} onChange={(e) => set(idx, "unitPrice", e.target.value)} placeholder={t("unitPrice")} className={`${inp} col-span-2`} />
          <input type="number" value={it.taxPct || ""} onChange={(e) => set(idx, "taxPct", e.target.value)} placeholder={t("taxPct")} className={`${inp} col-span-1`} />
          <input type="number" value={it.discountPct || ""} onChange={(e) => set(idx, "discountPct", e.target.value)} placeholder={t("discountPct")} className={`${inp} col-span-1`} />
          <span className="col-span-1 text-right text-xs font-semibold">{formatCurrency(it.lineTotal)}</span>
          <button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))} className="col-span-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <div className="text-right font-body text-sm font-bold text-primary">{t("grandTotal")}: {formatCurrency(total)}</div>
    </div>
  );
}
