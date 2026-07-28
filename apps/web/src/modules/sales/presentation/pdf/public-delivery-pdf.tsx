import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { PublicDeliveryResp } from "@sales/infrastructure/supabase-delivery-share.repository";

export interface PubDeliveryLabels { conduce: string; fromSalesOrder: string; dispatchDate: string; client: string; description: string; qty: string; receivedBy: string; shippingNotes: string }

// PDF del conduce desde los datos públicos (sin auth). Marca del RPC (logo→data-URI). Sin totales de dinero.
export async function publicDeliveryDoc(d: PublicDeliveryResp, l: PubDeliveryLabels): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const n = d.note!; const tn = d.tenant!;
  const brand: PdfBrand = { name: tn.display_name || tn.legal_name || "NÚCLEO",
    logo: tn.logo_url ? await imgToDataUri(tn.logo_url) : null, primaryColor: tn.primary_color, accentColor: tn.accent_color };
  const num = `${l.conduce.toUpperCase()} ${n.note_number}`;
  const sections = [...(n.shipping_notes ? [{ title: l.shippingNotes, body: n.shipping_notes }] : []),
    { title: l.receivedBy, body: n.received_by || "________________________" }];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[...(n.so_number ? [`${l.fromSalesOrder}: ${n.so_number}`] : []), ...(n.dispatch_date ? [`${l.dispatchDate}: ${n.dispatch_date}`] : []), n.status]}
    clientTitle={l.client} clientName={n.customer_name ?? ""} clientLines={[n.shipping_address ?? ""]}
    itemHeaders={[l.description, l.qty]} itemWidths={[75, 25]}
    itemRows={n.items.map((it) => [it.description, it.qty])} totals={[]} sections={sections} />;
}
