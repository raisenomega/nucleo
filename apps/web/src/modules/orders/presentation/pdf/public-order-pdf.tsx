import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { PublicOrderResp } from "@orders/infrastructure/supabase-order-share.repository";

const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;
export interface PubOrderLabels { order: string; date: string; client: string; description: string; qty: string; price: string; total: string; subtotal: string; tax: string; totalToday: string; nextCycle: string }

// PDF de la orden desde los datos públicos (sin auth). Marca del RPC (logo→data-URI). Incluye el detalle.
export async function publicOrderDoc(d: PublicOrderResp, l: PubOrderLabels): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const o = d.order!; const tn = d.tenant!;
  const brand: PdfBrand = { name: tn.display_name || tn.legal_name || "NÚCLEO",
    logo: tn.logo_url ? await imgToDataUri(tn.logo_url) : null, primaryColor: tn.primary_color, accentColor: tn.accent_color };
  const num = `${l.order.toUpperCase()} ${o.order_number ?? ""}`;
  const totals = [{ label: l.subtotal, value: $(o.subtotal) }, ...(o.tax ? [{ label: l.tax, value: $(o.tax) }] : []),
    ...(o.offer_hook != null   // 2b2.5: con oferta, el total pagado hoy = hook; el regular queda como próximo ciclo
      ? [{ label: l.totalToday.toUpperCase(), value: $(o.offer_hook), grand: true }, { label: l.nextCycle, value: $(o.total) }]
      : [{ label: l.total.toUpperCase(), value: $(o.total), grand: true }])];
  const a = o.address; // customer_address es objeto jsonb → aplanar a string
  const addr = a && typeof a === "object" ? [a.address, a.unit, a.city, a.state, a.zip].filter(Boolean).join(", ") : (a ?? "");
  const lines = [o.phone ?? "", o.email ?? "", addr, o.billing_frequency ?? ""];
  // Los items no guardan price (precio dinámico → total); derivar el unitario desde subtotal (reparto por qty).
  const tq = o.items.reduce((s, it) => s + (it.qty || 0), 0) || 1;
  const unit = (it: { price?: number; qty: number }) => (it.price != null ? it.price : (o.subtotal * ((it.qty || 0) / tq)) / (it.qty || 1));
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num} metaLines={[`${l.date}: ${o.created_at.slice(0, 10)}`, `${o.status}`]}
    clientTitle={l.client} clientName={o.customer_name} clientLines={lines}
    itemHeaders={[l.description, l.qty, l.price, l.total]} itemWidths={[55, 15, 15, 15]}
    itemRows={o.items.map((it) => [it.name, it.qty, $(unit(it)), $(unit(it) * it.qty)])} totals={totals} />;
}
