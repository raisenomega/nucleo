import { supabaseQuoteRepository } from "@quotes/infrastructure/supabase-quote.repository";
import { supabaseInvoiceRepository } from "@billing/infrastructure/supabase-invoice.repository";
import type { Lead } from "@crm/domain/lead.types";

// Genera cotización/factura reales desde el lead (mismos RPC que LeadDetailActions) y arma el link WhatsApp.
export const leadQuoteId = (leadId: string) => supabaseQuoteRepository.fromLead(leadId);
export const leadInvoiceId = (leadId: string) => supabaseInvoiceRepository.fromLead(leadId);
export const leadWaHref = (l: Lead, msg: string) => `https://wa.me/${l.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
