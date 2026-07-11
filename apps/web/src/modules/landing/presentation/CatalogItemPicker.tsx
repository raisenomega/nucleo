import { useState } from "react";
import { X, Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { CatalogItem } from "@landing/domain/landing-package.types";

export type Picked = { id: string; quantity: number };

// Multi-select reutilizable de items del catálogo (products O services) con cantidad.
export function CatalogItemPicker({ items, value, onChange, quantityLabel, emptyMessage }: {
  items: CatalogItem[]; value: Picked[]; onChange: (v: Picked[]) => void;
  quantityLabel: TranslationKey; emptyMessage: TranslationKey;
}) {
  const { t } = useI18n();
  const [sel, setSel] = useState("");
  const fld = "rounded-lg border border-border bg-background p-2 text-sm";
  const nameOf = (id: string) => items.find((i) => i.id === id)?.name ?? id;
  const available = items.filter((i) => !value.some((v) => v.id === i.id));
  const setQty = (id: string, q: number) => onChange(value.map((v) => (v.id === id ? { ...v, quantity: Math.max(1, q) } : v)));
  return (
    <div className="space-y-2">
      {value.length === 0 && <p className="text-xs text-muted-foreground">{t(emptyMessage)}</p>}
      {value.map((v) => (
        <div key={v.id} className="flex items-center gap-2">
          <span className="flex-1 text-sm text-foreground">{nameOf(v.id)}</span>
          <input type="number" min={1} value={v.quantity} title={t(quantityLabel)}
            onChange={(e) => setQty(v.id, Number(e.target.value))} className={`w-20 ${fld}`} />
          <button type="button" onClick={() => onChange(value.filter((x) => x.id !== v.id))} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
        </div>))}
      <p className="text-xs text-muted-foreground">{t(quantityLabel)}</p>
      {available.length > 0 && <div className="flex gap-2">
        <select value={sel} onChange={(e) => setSel(e.target.value)} className={`flex-1 ${fld}`}>
          <option value="">—</option>
          {available.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <button type="button" onClick={() => { if (sel) { onChange([...value, { id: sel, quantity: 1 }]); setSel(""); } }}
          className="flex items-center gap-1 rounded-lg border border-border px-3 text-sm text-foreground"><Plus className="h-4 w-4" /></button>
      </div>}
    </div>
  );
}
