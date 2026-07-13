import { X, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { LucideIconPicker } from "@shared/components/LucideIconPicker";
import type { ItemHighlight } from "@shared/types/item-highlight.types";

const MAX = 8;
// Editor repeatable de puntos destacados (icono Lucide + texto ES/EN) con reorder ↑/↓. Máx 8.
export function HighlightsEditor({ value, onChange }: { value: ItemHighlight[]; onChange: (v: ItemHighlight[]) => void }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const upd = (i: number, patch: Partial<ItemHighlight>) => onChange(value.map((h, k) => (k === i ? { ...h, ...patch } : h)));
  const move = (i: number, d: number) => { const j = i + d; const a = [...value]; if (j < 0 || j >= a.length) return; const [x] = a.splice(i, 1); if (x) a.splice(j, 0, x); onChange(a); };
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">{t("highlightsTitle")}</span>
      {value.map((h, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-2">
          <div className="flex items-center gap-2">
            <LucideIconPicker value={h.icon || null} onChange={(n) => upd(i, { icon: n })} />
            <button type="button" onClick={() => move(i, -1)} aria-label={t("moveUp")}><ChevronUp className="h-4 w-4" /></button>
            <button type="button" onClick={() => move(i, 1)} aria-label={t("moveDown")}><ChevronDown className="h-4 w-4" /></button>
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={t("delete")} className="ml-auto"><X className="h-4 w-4 text-destructive" /></button>
          </div>
          <input value={h.text_es} onChange={(e) => upd(i, { text_es: e.target.value })} placeholder={t("highlightTextEs")} className={fld} />
          <input value={h.text_en} onChange={(e) => upd(i, { text_en: e.target.value })} placeholder={t("highlightTextEn")} className={fld} />
        </div>))}
      {value.length < MAX && <button type="button" onClick={() => onChange([...value, { icon: "CheckCircle2", text_es: "", text_en: "" }])} className="flex items-center gap-1 text-sm text-foreground"><Plus className="h-4 w-4" /> {t("addHighlight")}</button>}
    </div>
  );
}
