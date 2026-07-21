import { supabase } from "@shared/lib/supabase";
import type { IQuoteRepository, Quote, QuoteItem, QuoteStatus, QuoteResult, QuotesSummary } from "@quotes/domain/quote.types";

interface IRow { description: string; quantity: number; unit_price: number; tax_pct: number; discount_pct: number; line_total: number; }
interface Row {
  id: string; quote_number: string | null; customer_id: string | null; client_name: string; client_phone: string | null; client_email: string | null;
  client_address: string | null; items: IRow[] | null; subtotal: number; tax_total: number; total: number; status: string;
  valid_until: string | null; notes: string | null; terms: string | null; linked_lead_id: string | null; linked_invoice_id: string | null; created_at: string;
  sent_at: string | null; sent_channels: string[] | null; updated_at: string | null;
}
const SEL = "id,quote_number,customer_id,client_name,client_phone,client_email,client_address,items,subtotal,tax_total,total,status,valid_until,notes,terms,linked_lead_id,linked_invoice_id,created_at,sent_at,sent_channels,updated_at";
const EMPTY: QuotesSummary = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0, total_quoted: 0 };
const ok = (e: { message: string } | null): QuoteResult => (e ? { ok: false, error: e.message } : { ok: true });
const toItem = (r: IRow): QuoteItem => ({ description: r.description, quantity: r.quantity, unitPrice: r.unit_price, taxPct: r.tax_pct, discountPct: r.discount_pct, lineTotal: r.line_total });
const fromItem = (i: QuoteItem) => ({ description: i.description, quantity: i.quantity, unit_price: i.unitPrice, tax_pct: i.taxPct, discount_pct: i.discountPct, line_total: i.lineTotal });
const toQuote = (r: Row): Quote => ({
  id: r.id, quoteNumber: r.quote_number, customerId: r.customer_id, clientName: r.client_name, clientPhone: r.client_phone, clientEmail: r.client_email,
  clientAddress: r.client_address, items: (r.items ?? []).map(toItem), subtotal: r.subtotal, taxTotal: r.tax_total, total: r.total,
  status: r.status as QuoteStatus, validUntil: r.valid_until, notes: r.notes, terms: r.terms,
  linkedLeadId: r.linked_lead_id, linkedInvoiceId: r.linked_invoice_id, createdAt: r.created_at,
  sentAt: r.sent_at, sentChannels: r.sent_channels ?? [], updatedAt: r.updated_at,
});

export const supabaseQuoteRepository: IQuoteRepository = {
  async list(): Promise<Quote[]> {
    const { data } = await supabase.from("quotes").select(SEL).order("created_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toQuote);
  },
  async save(d): Promise<QuoteResult> {
    return ok((await supabase.from("quotes").insert({
      customer_id: d.customerId, client_name: d.clientName, client_phone: d.clientPhone || null, client_email: d.clientEmail || null, client_address: d.clientAddress || null,
      items: d.items.map(fromItem), subtotal: d.subtotal, tax_total: d.taxTotal, total: d.total,
      valid_until: d.validUntil, notes: d.notes || null, terms: d.terms || null, status: d.status,
    })).error);
  },
  async update(id, d): Promise<QuoteResult> {
    // Excluye status a propósito (editar no re-envía; el estado se preserva).
    return ok((await supabase.from("quotes").update({
      customer_id: d.customerId, client_name: d.clientName, client_phone: d.clientPhone || null, client_email: d.clientEmail || null, client_address: d.clientAddress || null,
      items: d.items.map(fromItem), subtotal: d.subtotal, tax_total: d.taxTotal, total: d.total,
      valid_until: d.validUntil, notes: d.notes || null, terms: d.terms || null,
    }).eq("id", id)).error);
  },
  async setStatus(id, status: QuoteStatus): Promise<QuoteResult> {
    return ok((await supabase.from("quotes").update({ status }).eq("id", id)).error);
  },
  async convertToInvoice(id): Promise<string | null> {
    const { data } = await supabase.rpc("convert_quote_to_invoice", { p_quote_id: id });
    return (data as string | null) ?? null;
  },
  async fromLead(leadId): Promise<string | null> {
    const { data } = await supabase.rpc("generate_quote_from_lead", { p_lead_id: leadId });
    return (data as string | null) ?? null;
  },
  async summary(): Promise<QuotesSummary> {
    const { data } = await supabase.rpc("get_quotes_summary");
    return (data as QuotesSummary | null) ?? EMPTY;
  },
};
