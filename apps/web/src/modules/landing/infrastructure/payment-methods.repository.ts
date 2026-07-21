import { supabase } from "@shared/lib/supabase";
import type { PaymentMethod, PaymentMethodDraft } from "@landing/domain/payment-method.types";

const COLS = "id, method_key, is_active, is_default, display_name, config, display_order";

// Métodos de pago del tenant (RLS: escritura CEO+, lectura pública de activos). El checkout lee display_name
// y config.{instructions_es,instructions_en,ath_number} → el editor escribe esas MISMAS llaves.
export const paymentMethodsRepository = {
  async list(): Promise<PaymentMethod[]> {
    const { data } = await supabase.from("tenant_payment_methods").select(COLS).order("display_order");
    return (data as PaymentMethod[] | null) ?? [];
  },
  async save(d: PaymentMethodDraft): Promise<string | null> {
    const { id, ...row } = d;
    const res = id
      ? await supabase.from("tenant_payment_methods").update(row).eq("id", id)
      : await supabase.from("tenant_payment_methods").insert(row);
    return res.error ? res.error.message : null;
  },
  async remove(id: string): Promise<string | null> {
    return (await supabase.from("tenant_payment_methods").delete().eq("id", id)).error?.message ?? null;
  },
  async setFields(id: string, patch: Partial<Pick<PaymentMethod, "is_active" | "display_order">>): Promise<string | null> {
    return (await supabase.from("tenant_payment_methods").update(patch).eq("id", id)).error?.message ?? null;
  },
  // Un solo default a la vez: apaga los demás y prende este.
  async setDefault(id: string): Promise<string | null> {
    await supabase.from("tenant_payment_methods").update({ is_default: false }).neq("id", id);
    return (await supabase.from("tenant_payment_methods").update({ is_default: true }).eq("id", id)).error?.message ?? null;
  },
};
