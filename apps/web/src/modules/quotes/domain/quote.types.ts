// BC quotes — cotizaciones. Puro. Hermano de invoices con flujo de aprobación del cliente.
export type QuoteResult = { ok: true } | { ok: false; error: string };
export type QuoteStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired" | "converted";

export interface QuoteItem {
  readonly description: string; readonly quantity: number; readonly unitPrice: number;
  readonly taxPct: number; readonly discountPct: number; readonly lineTotal: number;
}
export interface Quote {
  readonly id: string; readonly quoteNumber: string | null; readonly clientName: string;
  readonly clientPhone: string | null; readonly clientEmail: string | null; readonly clientAddress: string | null;
  readonly items: QuoteItem[]; readonly subtotal: number; readonly taxTotal: number; readonly total: number;
  readonly status: QuoteStatus; readonly validUntil: string | null; readonly notes: string | null; readonly terms: string | null;
  readonly linkedLeadId: string | null; readonly linkedInvoiceId: string | null; readonly createdAt: string;
}
export interface QuoteInput {
  clientName: string; clientPhone: string; clientEmail: string; clientAddress: string;
  items: QuoteItem[]; subtotal: number; taxTotal: number; total: number;
  validUntil: string | null; notes: string; terms: string; status: QuoteStatus;
}
export interface QuotesSummary {
  draft: number; sent: number; accepted: number; rejected: number; expired: number; total_quoted: number;
}
export interface IQuoteRepository {
  list(): Promise<Quote[]>;
  save(input: QuoteInput): Promise<QuoteResult>;
  update(id: string, input: QuoteInput): Promise<QuoteResult>;  // edición: status NO se toca

  setStatus(id: string, status: QuoteStatus): Promise<QuoteResult>;
  convertToInvoice(id: string): Promise<string | null>;
  fromLead(leadId: string): Promise<string | null>;
  summary(): Promise<QuotesSummary>;
}
