export type FieldKind = "text" | "email" | "tel" | "textarea" | "select" | "radio" | "checkbox" | "number";
export interface FieldOption { value: string; label_es: string; label_en: string; }
export interface OrderFormField {
  id: string; orderIndex: number; kind: FieldKind; fieldKey: string;
  labelEs: string; labelEn: string; required: boolean;
  validation: Record<string, unknown>; options: FieldOption[];
  conditionalOn: { field: string; value: string } | null;
}
export interface OrderForm { id: string; name: string; fields: OrderFormField[]; }
export interface PaymentOption {
  methodKey: string; nameEs: string; nameEn: string;
  instructionsEs: string; instructionsEn: string; athNumber: string | null;
}

export interface OrderItemInput { kind: "product" | "service" | "package"; id: string; qty: number; name: string; }
export interface CreateOrderInput {
  formId: string; items: OrderItemInput[]; customFields: Record<string, unknown>;
  paymentMethodKey: string; couponCode: string | null; clientTotal: number;
}
export type OrderResult =
  | { ok: true; orderNumber: string; orderId: string }
  | { ok: false; code: string; errors?: { field: string; error: string }[] };

// Reglas de pricing crudas (para preview client-side espejo del server).
export interface PricingRules {
  matrix: { freqs: string[]; bins: number[]; grid: number[][] } | null;
  addons: { extraLids: number; extraRegularBins: number; hydroJet: number } | null;
  taxPct: number; shipping: number;
}
