import { supabase } from "@shared/lib/supabase";

// Estado de cuenta público (anon, patrón factura) + share URL branded (staff). NO expone datos internos.
export interface PublicStatementResp {
  status: string;
  customer_name?: string; total_due?: number;
  invoices?: { invoice_number: string | null; total: number; balance: number; due_date: string | null; days_overdue: number }[];
  payments?: { date: string; amount: number; invoice_number: string | null }[];
  tenant?: { display_name: string | null; legal_name: string | null; contact_phone: string | null; primary_color: string; accent_color: string; logo_url: string | null };
}

export async function getStatementByToken(token: string): Promise<PublicStatementResp> {
  const { data } = await supabase.rpc("get_public_customer_statement", { p_token: token });
  return (data as PublicStatementResp | null) ?? { status: "error" };
}

export async function getCustomerShareUrl(id: string): Promise<string | null> {
  const { data } = await supabase.rpc("get_customer_share_url", { p_customer_id: id });
  return (data as string | null) ?? null;
}
