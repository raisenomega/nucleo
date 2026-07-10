import { supabase } from "@shared/lib/supabase";

// Acceso anónimo a la cotización vía token (RPCs _public de la migración 124).
export interface PublicQuoteResp {
  status: string;
  quote?: {
    quote_number: string | null; client_name: string; client_email: string | null; client_phone: string | null;
    client_address: string | null; items: { description: string; quantity: number; line_total: number }[];
    subtotal: number; tax_total: number; total: number; notes: string | null; terms: string | null; valid_until: string | null;
  };
  tenant?: {
    display_name: string | null; legal_name: string | null; contact_phone: string | null;
    primary_color: string; accent_color: string; logo_url: string | null;
  };
  pdf_url?: string | null; pdf_url_expires_at?: string | null;
  tenant_display_name?: string | null; tenant_contact_phone?: string | null; responded_at?: string;
}

export async function getQuoteByToken(token: string): Promise<PublicQuoteResp> {
  const { data } = await supabase.rpc("_public_get_quote_by_token", { _token: token });
  return (data as PublicQuoteResp | null) ?? { status: "error" };
}

export async function respondQuote(token: string, decision: "accepted" | "rejected", note: string): Promise<PublicQuoteResp> {
  const { data } = await supabase.rpc("_public_quote_respond", { _token: token, _decision: decision, _note: note });
  return (data as PublicQuoteResp | null) ?? { status: "error" };
}
