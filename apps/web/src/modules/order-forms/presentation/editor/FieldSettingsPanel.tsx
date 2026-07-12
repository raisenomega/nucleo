import { useI18n } from "@shared/i18n";
import { BasicFieldSettings } from "@order-forms/presentation/editor/BasicFieldSettings";
import { KindSpecificSettings } from "@order-forms/presentation/editor/KindSpecificSettings";
import { ConditionalOnEditor } from "@order-forms/presentation/editor/ConditionalOnEditor";
import type { EditorField, FieldPatch } from "@order-forms/domain/order-form-field.types";

export function FieldSettingsPanel({ field, fields, onChange, onRemove }: {
  field: EditorField | null; fields: EditorField[]; onChange: (id: string, p: FieldPatch) => void; onRemove: (id: string) => void;
}) {
  const { t } = useI18n();
  if (!field) return <aside className="border-l border-border p-4"><p className="text-sm text-muted-foreground">{t("ofSelectField")}</p></aside>;
  const patch = (p: FieldPatch) => onChange(field.id, p);
  return (
    <aside className="space-y-3 overflow-y-auto border-l border-border p-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("ofFieldSettings")}</h3>
      <BasicFieldSettings field={field} onChange={patch} />
      <KindSpecificSettings field={field} onChange={patch} />
      <ConditionalOnEditor field={field} allFields={fields} onChange={patch} />
      <button type="button" onClick={() => onRemove(field.id)} className="w-full rounded-lg border border-destructive px-3 py-2 text-sm font-medium text-destructive">{t("ofDeleteField")}</button>
    </aside>
  );
}
