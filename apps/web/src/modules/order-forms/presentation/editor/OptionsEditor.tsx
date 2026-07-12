import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { FieldOption } from "@order-forms/domain/order-form-field.types";

export function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: (o: FieldOption[]) => void }) {
  const { t } = useI18n();
  const upd = (i: number, patch: Partial<FieldOption>) => onChange(options.map((o, k) => (k === i ? { ...o, ...patch } : o)));
  const inp = "flex-1 rounded border border-border bg-background p-1 text-xs";
  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{t("ofOptions")}</span>
      {options.map((o, i) => (
        <div key={i} className="flex items-center gap-1">
          <input value={o.label_es} onChange={(e) => upd(i, { label_es: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") || `opt${i + 1}` })} placeholder="ES" className={inp} />
          <input value={o.label_en} onChange={(e) => upd(i, { label_en: e.target.value })} placeholder="EN" className={inp} />
          <button type="button" onClick={() => onChange(options.filter((_, k) => k !== i))} aria-label={t("delete")}><X className="h-4 w-4 text-destructive" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...options, { value: `opt${options.length + 1}`, label_es: "", label_en: "" }])} className="text-xs font-medium text-foreground underline">+ {t("ofAddOption")}</button>
    </div>
  );
}
