import type { EditorField, FieldOption } from "@order-forms/domain/order-form-field.types";
import type { OrderFormFull } from "@order-forms/domain/order-form.types";
import type { FieldKind } from "@order-forms/domain/field-kind.types";

export interface FieldRow {
  id: string; kind: string; field_key: string; order_index: number;
  label_es: string; label_en: string | null; placeholder_es: string | null; placeholder_en: string | null;
  required: boolean; group_name: string | null; validation_rules: unknown; options: unknown; conditional_on: unknown;
}
export interface FormRow { id: string; name: string; description: string | null; is_default: boolean; applies_to_kind: string | null; }

export const toEditorField = (r: FieldRow): EditorField => ({
  id: r.id, kind: r.kind as FieldKind, fieldKey: r.field_key, orderIndex: r.order_index,
  labelEs: r.label_es, labelEn: r.label_en ?? "", placeholderEs: r.placeholder_es ?? "", placeholderEn: r.placeholder_en ?? "",
  required: r.required, groupName: r.group_name ?? "",
  validation: (r.validation_rules ?? {}) as Record<string, unknown>,
  options: (Array.isArray(r.options) ? r.options : []) as FieldOption[],
  conditionalOn: (r.conditional_on ?? null) as EditorField["conditionalOn"],
});

export const toFullForm = (f: FormRow, fields: FieldRow[]): OrderFormFull => ({
  id: f.id, name: f.name, description: f.description ?? "", isDefault: f.is_default, appliesToKind: f.applies_to_kind,
  fields: fields.map(toEditorField).sort((a, b) => a.orderIndex - b.orderIndex),
});

// EditorField → row para upsert en tenant_order_form_fields.
export const toFieldRow = (tenantId: string, formId: string, f: EditorField) => ({
  id: f.id, tenant_id: tenantId, form_id: formId, order_index: f.orderIndex, kind: f.kind, field_key: f.fieldKey,
  label_es: f.labelEs, label_en: f.labelEn || null, placeholder_es: f.placeholderEs || null, placeholder_en: f.placeholderEn || null,
  required: f.required, group_name: f.groupName || null, validation_rules: f.validation, options: f.options,
  conditional_on: f.conditionalOn,
});
