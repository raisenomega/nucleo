import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import type { EditorField, FieldPatch } from "@order-forms/domain/order-form-field.types";

export function BasicFieldSettings({ field, onChange }: { field: EditorField; onChange: (p: FieldPatch) => void }) {
  const { t } = useI18n();
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const txt = (key: "labelEs" | "labelEn" | "placeholderEs" | "placeholderEn" | "groupName", labelKey: TranslationKey, val: string) => (
    <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
      <input value={val} onChange={(e) => onChange({ [key]: e.target.value })} className={fld} /></label>
  );
  return (
    <div className="space-y-2">
      {txt("labelEs", "ofLabelEs", field.labelEs)}
      {txt("labelEn", "ofLabelEn", field.labelEn)}
      {txt("placeholderEs", "ofPlaceholderEs", field.placeholderEs)}
      {txt("placeholderEn", "ofPlaceholderEn", field.placeholderEn)}
      {txt("groupName", "ofGroup", field.groupName)}
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={field.required} onChange={(e) => onChange({ required: e.target.checked })} className="h-4 w-4" />{t("ofRequired")}
      </label>
    </div>
  );
}
