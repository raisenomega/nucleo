import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { FieldOption } from "@order-forms/domain/order-form-field.types";

// Opciones de un select/radio. Si el campo tiene regla de precio (alguna opción trae price) se muestran inputs de
// precio por opción (matrix_1d = price + unit_price; tiered_qty = solo price) y el `value` se BLOQUEA: editar el
// label ya no regenera el value (rompería el link con las tiers de la regla). El backend sincroniza regla + display.
export function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: (o: FieldOption[]) => void }) {
  const { t } = useI18n();
  const hasPrice = options.some((o) => o.price != null);
  const hasUnit = options.some((o) => o.unit_price != null);
  const upd = (i: number, patch: Partial<FieldOption>) => onChange(options.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const num = (s: string) => (s === "" ? null : Number(s));
  const inp = "flex-1 rounded border border-border bg-background p-1 text-xs";
  const pr = "w-20 rounded border border-border bg-background p-1 text-xs";
  const editEs = (i: number, v: string) =>
    upd(i, hasPrice ? { label_es: v } : { label_es: v, value: v.toLowerCase().replace(/\s+/g, "_") || `opt${i + 1}` });
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{t("ofOptions")}</span>
      {options.map((o, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1">
          <input value={o.label_es} onChange={(e) => editEs(i, e.target.value)} placeholder="ES" className={inp} />
          <input value={o.label_en} onChange={(e) => upd(i, { label_en: e.target.value })} placeholder="EN" className={inp} />
          {hasPrice && <input type="number" step="0.01" min="0" value={o.price ?? ""} onChange={(e) => upd(i, { price: num(e.target.value) })} placeholder={t("ofOptPrice")} className={pr} />}
          {hasUnit && <input type="number" step="0.01" min="0" value={o.unit_price ?? ""} onChange={(e) => upd(i, { unit_price: num(e.target.value) })} placeholder={t("ofOptUnitPrice")} className={pr} />}
          <button type="button" onClick={() => onChange(options.filter((_, k) => k !== i))} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...options, { value: `opt${options.length + 1}`, label_es: "", label_en: "" }])} className="text-xs font-medium text-foreground underline">+ {t("ofAddOption")}</button>
    </div>
  );
}
