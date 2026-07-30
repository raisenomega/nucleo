import type { FieldKind } from "@order-forms/domain/field-kind.types";

// price/unit_price: precio editable por opción (solo cuando el campo tiene regla de precio asociada; matrix_1d usa
// ambos, tiered_qty solo price). price_display/detail_* los mantiene el backend (trigger) — se preservan por spread.
export interface FieldOption {
  value: string; label_es: string; label_en: string;
  price?: number | null; unit_price?: number | null; price_display?: string | null;
  detail_es?: string | null; detail_en?: string | null;
}
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
