import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Order } from "@orders/domain/order.types";

type T = (k: TranslationKey) => string;
const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;

// Comprobante de orden → SalesDocPdf (cliente + items + totales). Sin watermark (las órdenes no son borradores).
export async function orderDoc(o: Order, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const num = `${t("docOrder")} ${o.orderNumber ?? ""}`;
  const totals = [{ label: t("subtotal"), value: $(o.subtotal) },
    ...(o.tax ? [{ label: t("tax"), value: $(o.tax) }] : []),
    ...(o.shipping ? [{ label: t("ordTotShipping"), value: $(o.shipping) }] : []),
    ...(o.discount ? [{ label: t("ordTotDiscount"), value: `-${$(o.discount)}` }] : []),
    { label: t("total").toUpperCase(), value: $(o.total), grand: true }];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[`${t("date")}: ${o.createdAt.slice(0, 10)}`, `${t("status")}: ${o.status}`]}
    clientTitle={t("ordCustomerTitle")} clientName={o.customerName} clientLines={[o.customerPhone ?? "", o.customerEmail ?? ""]}
    itemHeaders={[t("description"), t("quantity"), t("unitPrice"), t("total")]} itemWidths={[55, 15, 15, 15]}
    itemRows={o.items.map((it) => [it.name, it.qty, $(it.price), $(it.qty * it.price)])} totals={totals} />;
}

export async function orderListDoc(orders: readonly Order[], filterLabel: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReportPdf } = await import("@shared/pdf/ReportPdf");
  const body = { title: `${t("docOrderList")} · ${filterLabel}`,
    kpis: [{ label: t("ordItemsCount"), value: orders.length }, { label: t("total"), value: $(orders.reduce((s, o) => s + o.total, 0)) }],
    tables: [{ title: filterLabel, headers: [t("orderNumber"), t("ordColCustomer"), t("status"), t("date"), t("total")],
      rows: orders.map((o) => [o.orderNumber ?? "-", o.customerName, o.status, o.createdAt.slice(0, 10), $(o.total)]) }] };
  return <ReportPdf body={body} brand={brand} />;
}
