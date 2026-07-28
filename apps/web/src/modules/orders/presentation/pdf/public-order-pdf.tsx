import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { PublicOrderResp } from "@orders/infrastructure/supabase-order-share.repository";

const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;
export interface PubOrderLabels { order: string; date: string; client: string; description: string; qty: string; price: string; total: string; subtotal: string; tax: string }

// PDF de la orden desde los datos públicos (sin auth). Marca del RPC (logo→data-URI). Incluye el detalle.
export async function publicOrderDoc(d: PublicOrderResp, l: PubOrderLabels): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const o = d.order!; const tn = d.tenant!;
  const brand: PdfBrand = { name: tn.display_name || tn.legal_name || "NÚCLEO",
    logo: tn.logo_url ? await imgToDataUri(tn.logo_url) : null, primaryColor: tn.primary_color, accentColor: tn.accent_color };
  const num = `${l.order.toUpperCase()} ${o.order_number ?? ""}`;
  const totals = [{ label: l.subtotal, value: $(o.subtotal) }, ...(o.tax ? [{ label: l.tax, value: $(o.tax) }] : []),
    { label: l.total.toUpperCase(), value: $(o.total), grand: true }];
  const lines = [o.phone ?? "", o.email ?? "", o.address ?? "", o.billing_frequency ?? ""];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num} metaLines={[`${l.date}: ${o.created_at.slice(0, 10)}`, `${o.status}`]}
    clientTitle={l.client} clientName={o.customer_name} clientLines={lines}
    itemHeaders={[l.description, l.qty, l.price, l.total]} itemWidths={[55, 15, 15, 15]}
    itemRows={o.items.map((it) => [it.name, it.qty, $(it.price), $((it.price || 0) * it.qty)])} totals={totals} />;
}
