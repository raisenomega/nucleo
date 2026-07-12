import type { TranslationKey } from "./translations.keys";

export const enOrderForms = {
  landingOrderForms: "Forms", ofCreate: "Create new", ofCreateTitle: "New form", ofName: "Name", ofDescription: "Description",
  ofFields: "Fields", ofFieldCount: "{n} fields", ofCreatedAt: "Created", ofDefault: "Default", ofDuplicate: "Duplicate", ofMakeDefault: "Make default",
  ofEmptyTitle: "No forms yet", ofEmptyDesc: "Create your first one to receive orders with custom data.",
  ofDeleteConfirm: "Delete this form and all its fields?", ofErr: "Could not complete the action", ofErrName: "Name must be at least 3 characters", ofErrLabel: "Every field needs a Spanish label",
  ofUnsaved: "Unsaved", ofBasic: "Basic", ofAdvanced: "Advanced", ofSoon: "Soon", ofUntitled: "Untitled form", ofDropHint: "Add fields from the palette on the left.",
  ofCondBadge: "Conditional", ofSelectField: "Select a field in the preview to edit its properties.", ofFieldSettings: "Field properties", ofDeleteField: "Delete field",
  ofLabelEs: "Label (ES)", ofLabelEn: "Label (EN)", ofPlaceholderEs: "Placeholder (ES)", ofPlaceholderEn: "Placeholder (EN)", ofGroup: "Group", ofRequired: "Required",
  ofOptions: "Options", ofAddOption: "Add option", ofMin: "Min", ofMax: "Max", ofRows: "Rows", ofStep: "Step", ofPattern: "Pattern (regex)", ofDefaultChecked: "Checked by default",
  ofCondToggle: "Show only if another field has a value", ofCondValue: "Value",
  ofKindText: "Short text", ofKindEmail: "Email", ofKindTel: "Phone", ofKindTextarea: "Long text", ofKindNumber: "Number", ofKindSelect: "Dropdown", ofKindRadio: "Radio", ofKindCheckbox: "Checkbox",
  ofKindDate: "Date", ofKindAddress: "Full address", ofKindMatrix: "Price matrix", ofKindAddons: "Add-ons", ofKindRepeatable: "Repeatable group", ofKindFile: "File upload",
  ofItemFormLabel: "Order form", ofItemFormDefault: "— Use default form —",
  ofItemFormHint: "The form the customer sees when ordering this item. Default = the tenant's form marked as default.",
  ofDepsTitle: "You can't delete this form", ofDepsBody: "{n} catalog items are using it. Reassign them before deleting.", ofClose: "Close",
} satisfies Partial<Record<TranslationKey, string>>;
