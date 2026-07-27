import type { ReactElement } from "react";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import { STATUS_LABELS } from "@raisen-marketing/admin/lead-constants";
import type { MarketingLead } from "@raisen-marketing/data/lead-form.types";

// Reporte de leads comerciales → ReportPdf. Herramienta superadmin (español fijo, sin i18n).
export async function marketingLeadsDoc(leads: readonly MarketingLead[], brand: PdfBrand): Promise<ReactElement> {
  const { ReportPdf } = await import("@shared/pdf/ReportPdf");
  const count = (s: string) => leads.filter((l) => l.status === s).length;
  const body = {
    title: "Leads comerciales",
    kpis: [{ label: STATUS_LABELS.new, value: count("new") }, { label: STATUS_LABELS.contacted, value: count("contacted") },
      { label: STATUS_LABELS.qualified, value: count("qualified") }, { label: STATUS_LABELS.converted, value: count("converted") }],
    tables: [{ title: "Leads", headers: ["Fecha", "Nombre", "Email", "Negocio", "Estado", "Fuente"],
      rows: leads.map((l) => [l.createdAt.slice(0, 10), l.customerName, l.customerEmail, l.businessType ?? "-",
        STATUS_LABELS[l.status] ?? l.status, l.utmSource ?? l.sourceUrl ?? "-"]) }],
  };
  return <ReportPdf body={body} brand={brand} />;
}
