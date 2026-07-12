import type { FieldKind } from "@order-forms/domain/field-kind.types";

export interface FieldOption { value: string; label_es: string; label_en: string; }
export interface ConditionalOn { field: string; value: string; }

// Campo en el editor (state local). id es un uuid real (generado en cliente al agregar) → upsert directo.
export interface EditorField {
  id: string; kind: FieldKind; fieldKey: string; orderIndex: number;
  labelEs: string; labelEn: string; placeholderEs: string; placeholderEn: string;
  required: boolean; groupName: string;
  validation: Record<string, unknown>; options: FieldOption[];
  conditionalOn: ConditionalOn | null;
}

export type FieldPatch = Partial<Omit<EditorField, "id" | "kind" | "orderIndex">>;
