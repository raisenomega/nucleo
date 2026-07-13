import type { OrderFormField } from "@orders-public/domain/order-form.types";

const visible = (f: OrderFormField, values: Record<string, unknown>) =>
  !f.conditionalOn || String(values[f.conditionalOn.field] ?? "") === f.conditionalOn.value;

const empty = (f: OrderFormField, v: unknown) =>
  f.kind === "checkbox" ? v !== true : v === undefined || v === null || String(v).trim() === "";

// Primer campo requerido (y visible) sin completar, o null si el form es válido. El caller decide el mensaje
// (validation.error_es/_en del campo si existe, si no una key i18n genérica).
export function firstInvalidField(fields: OrderFormField[], values: Record<string, unknown>): OrderFormField | null {
  for (const f of fields) {
    if (!visible(f, values) || !f.required) continue;
    if (empty(f, values[f.fieldKey])) return f;
  }
  return null;
}
