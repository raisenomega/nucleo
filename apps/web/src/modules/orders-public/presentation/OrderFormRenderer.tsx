import { Fragment } from "react";
import { useI18n } from "@shared/i18n";
import { FieldInput } from "@orders-public/presentation/FieldInput";
import { SectionHeader } from "@orders-public/presentation/SectionHeader";
import type { OrderFormField } from "@orders-public/domain/order-form.types";

export function OrderFormRenderer({ fields, values, onChange }: {
  fields: OrderFormField[]; values: Record<string, unknown>; onChange: (key: string, v: unknown) => void;
}) {
  const { locale } = useI18n();
  const visible = (f: OrderFormField) => !f.conditionalOn || String(values[f.conditionalOn.field] ?? "") === f.conditionalOn.value;
  // Grid 2-col; textarea/checkbox/disclaimer/layout="full" ocupan la fila. SectionHeader al cambiar group_name.
  const full = (f: OrderFormField) => f.kind === "textarea" || f.kind === "checkbox" || f.kind === "disclaimer" || f.validation.layout === "full";
  let prevGroup: string | null = null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {fields.filter(visible).map((f) => {
        const header = f.groupName && f.groupName !== prevGroup
          ? <SectionHeader title={f.groupName} description={locale === "en" ? f.groupDescriptionEn : f.groupDescriptionEs} />
          : null;
        prevGroup = f.groupName;
        return (
          <Fragment key={f.id}>
            {header}
            <div className={full(f) ? "md:col-span-2" : ""}>
              <FieldInput field={f} value={values[f.fieldKey]} onChange={(v) => onChange(f.fieldKey, v)} />
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
