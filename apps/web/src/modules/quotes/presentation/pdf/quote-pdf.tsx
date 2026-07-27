import type { ReactElement } from "react";
import { renderPdfBlob } from "@shared/pdf/render-blob";
import { uploadTenantPdf } from "@shared/lib/upload-tenant-pdf";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Quote, QuoteStatus } from "@quotes/domain/quote.types";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;
const WM: Partial<Record<QuoteStatus, { key: TranslationKey; ok?: boolean }>> = {
  draft: { key: "wmDraft" }, accepted: { key: "wmAccepted", ok: true }, converted: { key: "wmAccepted", ok: true },
  rejected: { key: "wmRejected" }, expired: { key: "wmExpired" },
};

export async function quoteDoc(q: Quote, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const wm = WM[q.status];
  const num = `${t("quote").toUpperCase()} ${q.quoteNumber ?? ""}`;
  const totals = [{ label: t("subtotal"), value: money(q.subtotal) }, { label: t("tax"), value: money(q.taxTotal) },
    { label: t("total").toUpperCase(), value: money(q.total), grand: true }];
  const sections = [...(q.notes ? [{ title: t("notes"), body: q.notes }] : []), ...(q.terms ? [{ title: t("terms"), body: q.terms }] : [])];
  return <SalesDocPdf brand={brand} docTitle={num} docNumber={num}
    metaLines={[`${t("date")}: ${q.createdAt.slice(0, 10)}`, ...(q.validUntil ? [`${t("validUntil")}: ${q.validUntil}`] : [])]}
    watermark={wm ? { text: t(wm.key), ok: wm.ok } : undefined}
    clientTitle={t("clientName")} clientName={q.clientName} clientLines={[q.clientPhone ?? "", q.clientEmail ?? "", q.clientAddress ?? ""]}
    itemHeaders={[t("description"), t("quantity"), t("unitPrice"), t("discountPct"), t("taxPct"), t("total")]} itemWidths={[40, 10, 15, 12, 11, 12]}
    itemRows={q.items.map((it) => [it.description, it.quantity, money(it.unitPrice), `${it.discountPct}%`, `${it.taxPct}%`, money(it.lineTotal)])}
    totals={totals} sections={sections} />;
}

// Flujo WhatsApp/link público: render client-side → blob → sube a tenant-pdfs → signed URL 7 días (sin Railway).
export async function uploadQuotePdf(tenantId: string, q: Quote, brand: PdfBrand, t: T): Promise<string | null> {
  const blob = await renderPdfBlob(await quoteDoc(q, brand, t));
  return blob ? uploadTenantPdf(tenantId, `quote/${q.id}-${Date.now()}.pdf`, blob) : null;
}
