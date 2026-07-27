import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Lead } from "@crm/domain/lead.types";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;

// Loader ficha de lead → SalesDocPdf (contacto + items cotizados si hay + total + notas).
export async function leadDoc(lead: Lead, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { SalesDocPdf } = await import("@shared/pdf/SalesDocPdf");
  const total = lead.items.reduce((s, i) => s + i.lineTotal, 0) || lead.quotedPrice;
  const lines = [lead.phone, lead.email, [lead.address, lead.city].filter(Boolean).join(", "),
    `${t("leadSource")}: ${lead.leadSourceLabel || lead.leadSource} · ${t("serviceRequested")}: ${lead.serviceTypeLabel || lead.serviceRequested}`,
    `${t("temperature")}: ${lead.temperature} · ${t("status")}: ${lead.status}`];
  return <SalesDocPdf brand={brand} docTitle={t("docLead")} docNumber={t("docLead")} metaLines={[`${t("date")}: ${lead.callDate}`]}
    clientTitle={t("contactName")} clientName={lead.contactName} clientLines={lines}
    itemHeaders={[t("description"), t("quantity"), t("unitPrice"), t("discountPct"), t("taxPct"), t("total")]} itemWidths={[40, 10, 15, 12, 11, 12]}
    itemRows={lead.items.map((it) => [it.description, it.quantity, money(it.unitPrice), `${it.discountPct}%`, `${it.taxPct}%`, money(it.lineTotal)])}
    totals={[{ label: t("grandTotal").toUpperCase(), value: money(total), grand: true }]}
    sections={lead.notes ? [{ title: t("notes"), body: lead.notes }] : undefined} />;
}
