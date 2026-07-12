import type { TranslationKey } from "@shared/i18n";

export type FieldKind =
  | "text" | "email" | "tel" | "textarea" | "number" | "select" | "radio" | "checkbox"
  | "date" | "address_block" | "matrix" | "addons_group" | "repeatable_group" | "file_upload";

export const BASIC_KINDS: FieldKind[] = ["text", "email", "tel", "textarea", "number", "select", "radio", "checkbox"];
export const ADVANCED_KINDS: FieldKind[] = ["date", "address_block", "matrix", "addons_group", "repeatable_group", "file_upload"];

// Campos con lista de opciones (select/radio).
export const OPTION_KINDS: FieldKind[] = ["select", "radio"];

export const KIND_LABEL: Record<FieldKind, TranslationKey> = {
  text: "ofKindText", email: "ofKindEmail", tel: "ofKindTel", textarea: "ofKindTextarea", number: "ofKindNumber",
  select: "ofKindSelect", radio: "ofKindRadio", checkbox: "ofKindCheckbox", date: "ofKindDate",
  address_block: "ofKindAddress", matrix: "ofKindMatrix", addons_group: "ofKindAddons",
  repeatable_group: "ofKindRepeatable", file_upload: "ofKindFile",
};
