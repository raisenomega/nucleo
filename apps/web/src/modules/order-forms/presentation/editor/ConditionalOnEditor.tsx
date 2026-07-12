import { useI18n } from "@shared/i18n";
import type { EditorField, FieldPatch } from "@order-forms/domain/order-form-field.types";

export function ConditionalOnEditor({ field, allFields, onChange }: {
  field: EditorField; allFields: EditorField[]; onChange: (p: FieldPatch) => void;
}) {
  const { t } = useI18n();
  const others = allFields.filter((f) => f.id !== field.id);
  const c = field.conditionalOn;
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <div className="space-y-2 border-t border-border pt-2">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={!!c} onChange={(e) => onChange({ conditionalOn: e.target.checked ? { field: others[0]?.fieldKey ?? "", value: "" } : null })} className="h-4 w-4" />
        {t("ofCondToggle")}
      </label>
      {c && (
        <div className="space-y-1">
          <select value={c.field} onChange={(e) => onChange({ conditionalOn: { ...c, field: e.target.value } })} className={fld}>
            {others.map((f) => <option key={f.id} value={f.fieldKey}>{f.labelEs || f.fieldKey}</option>)}
          </select>
          <input value={c.value} onChange={(e) => onChange({ conditionalOn: { ...c, value: e.target.value } })} placeholder={t("ofCondValue")} className={fld} />
        </div>
      )}
    </div>
  );
}
