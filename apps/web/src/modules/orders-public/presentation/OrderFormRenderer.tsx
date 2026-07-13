import { FieldInput } from "@orders-public/presentation/FieldInput";
import type { OrderFormField } from "@orders-public/domain/order-form.types";

export function OrderFormRenderer({ fields, values, onChange }: {
  fields: OrderFormField[]; values: Record<string, unknown>; onChange: (key: string, v: unknown) => void;
}) {
  const visible = (f: OrderFormField) => !f.conditionalOn || String(values[f.conditionalOn.field] ?? "") === f.conditionalOn.value;
  // Grid 2-col en desktop; textarea/checkbox y layout="full" ocupan la fila completa.
  const full = (f: OrderFormField) => f.kind === "textarea" || f.kind === "checkbox" || f.validation.layout === "full";
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {fields.filter(visible).map((f) => (
        <div key={f.id} className={full(f) ? "md:col-span-2" : ""}>
          <FieldInput field={f} value={values[f.fieldKey]} onChange={(v) => onChange(f.fieldKey, v)} />
        </div>
      ))}
    </div>
  );
}
