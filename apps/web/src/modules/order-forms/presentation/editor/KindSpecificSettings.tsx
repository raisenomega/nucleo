import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { OptionsEditor } from "@order-forms/presentation/editor/OptionsEditor";
import type { EditorField, FieldPatch } from "@order-forms/domain/order-form-field.types";

export function KindSpecificSettings({ field, onChange }: { field: EditorField; onChange: (p: FieldPatch) => void }) {
  const { t } = useI18n();
  const v = field.validation;
  const setV = (patch: Record<string, unknown>) => onChange({ validation: { ...v, ...patch } });
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const numIn = (key: string, labelKey: TranslationKey) => (
    <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
      <input type="number" value={(v[key] as number | undefined) ?? ""} onChange={(e) => setV({ [key]: e.target.value === "" ? undefined : Number(e.target.value) })} className={fld} /></label>
  );
  if (field.kind === "text") return <>{numIn("min", "ofMin")}{numIn("max", "ofMax")}</>;
  if (field.kind === "textarea") return <>{numIn("max", "ofMax")}{numIn("rows", "ofRows")}</>;
  if (field.kind === "number") return <>{numIn("min", "ofMin")}{numIn("max", "ofMax")}{numIn("step", "ofStep")}</>;
  if (field.kind === "tel") return (
    <label className="block"><span className="mb-1 block text-xs font-medium text-muted-foreground">{t("ofPattern")}</span>
      <input value={(v.pattern as string) ?? ""} onChange={(e) => setV({ pattern: e.target.value })} placeholder="^[0-9+()\-\s]+$" className={fld} /></label>
  );
  if (field.kind === "select" || field.kind === "radio") return <OptionsEditor options={field.options} onChange={(o) => onChange({ options: o })} />;
  if (field.kind === "checkbox") return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" checked={v.default === true} onChange={(e) => setV({ default: e.target.checked })} className="h-4 w-4" />{t("ofDefaultChecked")}</label>
  );
  return null;
}
