import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { PublicInvoiceResp } from "@billing/infrastructure/supabase-invoice-share.repository";

const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;
export interface PubInvoiceLabels { invoice: string; date: string; dueDate: string; client: string; description: string; qty: string; price: string; total: string; subtotal: string; tax: string }

// PDF de la factura desde los datos públicos (sin auth). La marca sale del propio RPC (logo→data-URI).
export async function publicInvoiceDoc(d: PublicInvoiceResp, l: PubInvoiceLabels): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const inv = d.invoice!; const tn = d.tenant!;
  const brand: PdfBrand = { name: tn.display_name || tn.legal_name || "NÚCLEO",
    logo: tn.logo_url ? await imgToDataUri(tn.logo_url) : null, primaryColor: tn.primary_color, accentColor: tn.accent_color };
  const num = `${l.invoice.toUpperCase()} ${inv.invoice_number ?? ""}`;
  const totals = [{ label: l.subtotal, value: $(inv.subtotal) }, ...(inv.tax ? [{ label: l.tax, value: $(inv.tax) }] : []),
    { label: l.total.toUpperCase(), value: $(inv.total), grand: true }];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[`${l.date}: ${inv.created_at.slice(0, 10)}`, ...(inv.due_date ? [`${l.dueDate}: ${inv.due_date}`] : [])]}
    clientTitle={l.client} clientName={inv.client_name} clientLines={[inv.phone ?? "", inv.email ?? ""]}
    itemHeaders={[l.description, l.qty, l.price, l.total]} itemWidths={[55, 15, 15, 15]}
    itemRows={inv.items.map((it) => [it.description, it.quantity, $(it.unit_price), $(it.line_total)])} totals={totals} />;
}
