import { supabase } from "@shared/lib/supabase";

// Envío de cotización: RPCs de la migración 122 (SECURITY DEFINER).
export type ApprovalToken = { tokenPlain: string; approvalUrl: string; expiresAt: string };

// Acuña el token de aprobación. null si error o rate_limited (data.error='rate_limited').
export async function createApprovalToken(quoteId: string): Promise<ApprovalToken | null> {
  const { data, error } = await supabase.rpc("create_quote_approval_token", { p_quote_id: quoteId });
  const d = data as { token_plain?: string; approval_url?: string; expires_at?: string; error?: string } | null;
  if (error || !d || d.error || !d.token_plain || !d.approval_url || !d.expires_at) return null;
  return { tokenPlain: d.token_plain, approvalUrl: d.approval_url, expiresAt: d.expires_at };
}

// Marca la cotización como enviada + dispara email si 'email' está en canales.
export async function markQuoteSent(quoteId: string, channels: string[], tokenPlain: string, message: string): Promise<boolean> {
  const { error } = await supabase.rpc("send_quote", {
    p_quote_id: quoteId, p_channels: channels, p_token_plain: tokenPlain, p_message: message,
  });
  return !error;
}
