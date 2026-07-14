import { useI18n } from "@shared/i18n";
import { useOrderFormFields, type DetailField } from "@orders/presentation/detail/useOrderFormFields.hook";

// Renderiza los custom_fields de la orden resueltos contra los campos del form (labels, options, checkbox Sí/No,
// conditional_on, grupos por sección). Los disclaimer se omiten. Sin form_id o sin campos → no renderiza.
export function OrderCustomFieldsBlock({ formId, customFields }: { formId: string | null; customFields: Record<string, unknown> }) {
  const { t, locale } = useI18n();
  const fields = useOrderFormFields(formId);
  if (!formId || fields.length === 0) return null;
  const visible = (f: DetailField) => !f.conditionalOn || String(customFields[f.conditionalOn.field] ?? "") === f.conditionalOn.value;
  const value = (f: DetailField): string | null => {
    const raw = customFields[f.fieldKey];
    if (f.kind === "checkbox") return raw === true ? t("ordFieldYes") : t("ordFieldNo");
    if (raw === undefined || raw === null || String(raw).trim() === "") return null;
    if (f.kind === "select" || f.kind === "radio") {
      const o = f.options.find((x) => x.value === String(raw));
      return o ? (locale === "en" ? o.label_en : o.label_es) : String(raw);
    }
    return String(raw);
  };
  let prevGroup: string | null = null;
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="mb-3 font-semibold text-foreground">{t("ordCustomFieldsTitle")}</h2>
      <div className="space-y-1.5">
        {fields.filter((f) => f.kind !== "disclaimer" && visible(f)).map((f) => {
          const val = value(f); if (val === null) return null;
          const header = f.groupName && f.groupName !== prevGroup
            ? <p className="pt-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{f.groupName}</p> : null;
          prevGroup = f.groupName;
          return (
            <div key={f.fieldKey}>{header}
              <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{(locale === "en" ? f.labelEn : f.labelEs) ?? f.labelEs}</span><span className="text-right text-foreground">{val}</span></div>
            </div>);
        })}
      </div>
    </section>
  );
}
