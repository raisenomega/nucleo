import { FieldInput } from "@orders-public/presentation/FieldInput";
import type { OrderFormField } from "@orders-public/domain/order-form.types";

export function OrderFormRenderer({ fields, values, onChange }: {
  fields: OrderFormField[]; values: Record<string, unknown>; onChange: (key: string, v: unknown) => void;
}) {
  const visible = (f: OrderFormField) => !f.conditionalOn || String(values[f.conditionalOn.field] ?? "") === f.conditionalOn.value;
  return (
    <div className="space-y-3">
      {fields.filter(visible).map((f) => (
        <FieldInput key={f.id} field={f} value={values[f.fieldKey]} onChange={(v) => onChange(f.fieldKey, v)} />
      ))}
    </div>
  );
}
