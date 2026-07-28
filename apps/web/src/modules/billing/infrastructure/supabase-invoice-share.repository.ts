import { supabase } from "@shared/lib/supabase";

// Página pública de factura (anon, patrón cotización) + helpers de envío (staff).
export interface PublicInvoiceResp {
  status: string;
  invoice?: {
    invoice_number: string | null; client_name: string; phone: string | null; email: string | null;
    items: { description: string; quantity: number; unit_price: number; tax_pct: number; discount_pct: number; line_total: number }[];
    subtotal: number; tax: number; total: number; status: string; due_date: string | null; created_at: string;
  };
  tenant?: { display_name: string | null; legal_name: string | null; contact_phone: string | null; primary_color: string; accent_color: string; logo_url: string | null };
  pdf_url?: string | null;
}

export async function getInvoiceByToken(token: string): Promise<PublicInvoiceResp> {
  const { data } = await supabase.rpc("get_public_invoice", { p_token: token });
  return (data as PublicInvoiceResp | null) ?? { status: "error" };
}

// URL branded (https://{primary_domain}/factura/{token}) para el WhatsApp — la arma el backend.
export async function getInvoiceShareUrl(id: string): Promise<string | null> {
  const { data } = await supabase.rpc("get_invoice_share_url", { p_invoice_id: id });
  return (data as string | null) ?? null;
}

export async function markInvoiceSent(id: string): Promise<void> {
  await supabase.rpc("mark_invoice_sent", { p_invoice_id: id });
}
