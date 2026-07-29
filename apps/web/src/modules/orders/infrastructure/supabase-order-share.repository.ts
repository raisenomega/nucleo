import { supabase } from "@shared/lib/supabase";

// Página pública de orden (anon, patrón factura) + share URL branded (staff).
export interface PublicOrderResp {
  status: string;
  order?: {
    order_number: string | null; customer_name: string; phone: string | null; email: string | null;
    address: { address?: string | null; unit?: string | null; city?: string | null; state?: string | null; zip?: string | null } | string | null;
    items: { name: string; qty: number; price: number; kind?: string }[];
    subtotal: number; tax: number; shipping: number; discount: number; total: number;
    status: string; created_at: string; billing_frequency: string | null; source: string | null; custom_fields: Record<string, unknown>;
  };
  tenant?: { display_name: string | null; legal_name: string | null; contact_phone: string | null; primary_color: string; accent_color: string; logo_url: string | null };
}

export async function getOrderByToken(token: string): Promise<PublicOrderResp> {
  const { data } = await supabase.rpc("get_public_order", { p_token: token });
  return (data as PublicOrderResp | null) ?? { status: "error" };
}

export async function getOrderShareUrl(id: string): Promise<string | null> {
  const { data } = await supabase.rpc("get_order_share_url", { p_order_id: id });
  return (data as string | null) ?? null;
}
