import { supabase } from "@shared/lib/supabase";
import type { Result } from "@sales/domain/sales-order.types";

// Página pública del conduce (anon, patrón factura/orden) + share URL branded (staff).
export interface PublicDeliveryResp {
  status: string;
  note?: {
    note_number: string; status: string; dispatch_date: string | null; delivery_date: string | null;
    shipping_address: string | null; shipping_notes: string | null; received_by: string | null;
    signature: string | null; so_number: string | null; customer_name: string | null;
    items: { description: string; qty: number }[];
  };
  tenant?: { display_name: string | null; legal_name: string | null; contact_phone: string | null; primary_color: string; accent_color: string; logo_url: string | null };
}

export async function getDeliveryByToken(token: string): Promise<PublicDeliveryResp> {
  const { data } = await supabase.rpc("get_public_delivery_note", { p_token: token });
  return (data as PublicDeliveryResp | null) ?? { status: "error" };
}

// Null de negocio (conduce sin public_token) dentro del ok:true; el fallo, aparte.
export async function getDeliveryShareUrl(id: string): Promise<Result<string | null, string>> {
  const { data, error } = await supabase.rpc("get_delivery_share_url", { p_note_id: id });
  if (error) return { ok: false, error: error.message };
  return { ok: true, value: (data as string | null) ?? null };
}
