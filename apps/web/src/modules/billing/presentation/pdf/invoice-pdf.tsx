import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Invoice, InvoiceStatus } from "@billing/domain/invoice.types";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;
const WM: Partial<Record<InvoiceStatus, { key: TranslationKey; ok?: boolean }>> = {
  draft: { key: "wmDraft" }, paid: { key: "wmPaid", ok: true }, overdue: { key: "wmOverdue" }, cancelled: { key: "wmVoided" },
};
const HEADERS = (t: T) => [t("description"), t("quantity"), t("unitPrice"), t("discountPct"), t("taxPct"), t("total")];
const WIDTHS = [40, 10, 15, 12, 11, 12];
const itemRows = (items: Invoice["items"]) =>
  items.map((it) => [it.description, it.quantity, money(it.unitPrice), `${it.discountPct}%`, `${it.taxPct}%`, money(it.lineTotal)]);

// Loader factura → SalesDocPdf. status/paid/balance vienen del detalle (calculados en vivo desde los pagos).
export async function invoiceDoc(inv: Invoice, status: InvoiceStatus, paid: number, balance: number, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const wm = WM[status];
  const num = `${t("invoice").toUpperCase()} ${inv.invoiceNumber ?? ""}`;
  const totals = [{ label: t("subtotal"), value: money(inv.subtotal) }, { label: t("tax"), value: money(inv.tax) },
    { label: t("total").toUpperCase(), value: money(inv.total), grand: true },
    ...(paid > 0.01 ? [{ label: t("paid"), value: money(paid) }, { label: t("balance"), value: money(balance) }] : [])];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[`${t("date")}: ${inv.createdAt.slice(0, 10)}`, ...(inv.dueDate ? [`${t("dueDate")}: ${inv.dueDate}`] : [])]}
    watermark={wm ? { text: t(wm.key), ok: wm.ok } : undefined}
    clientTitle={t("clientName")} clientName={inv.clientName} clientLines={[inv.phone ?? "", inv.email ?? ""]}
    itemHeaders={HEADERS(t)} itemWidths={WIDTHS} itemRows={itemRows(inv.items)} totals={totals} />;
}
