// Método de pago del tenant (espeja tenant_payment_methods). El editor cubre SOLO los manuales (config de
// texto, sin Vault); los gateways (stripe/placetopay) requieren credenciales y no están implementados.
export const MANUAL_METHODS = ["ath_movil_manual", "cash_on_delivery", "bank_transfer", "offline_coordination"] as const;
export const GATEWAY_METHODS = ["stripe_connect", "placetopay", "ath_movil"] as const;
export type MethodKey = (typeof MANUAL_METHODS)[number] | (typeof GATEWAY_METHODS)[number];

// `config` respeta las llaves EXACTAS que lee el checkout (orders-public.repository): instructions_es/en,
// ath_number. account_details es extra para bank_transfer (informativo).
export interface MethodConfig { instructions_es?: string; instructions_en?: string; ath_number?: string; account_details?: string }

export interface PaymentMethod {
  id: string;
  method_key: MethodKey;
  is_active: boolean;
  is_default: boolean;
  display_name: { es?: string; en?: string };
  config: MethodConfig;
  display_order: number;
}
export type PaymentMethodDraft = Omit<PaymentMethod, "id"> & { id?: string };
