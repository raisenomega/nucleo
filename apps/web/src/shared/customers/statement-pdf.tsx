import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ReconSection } from "@shared/pdf/ReconciliationPdf";
import type { PublicStatementResp } from "@shared/customers/customer-statement.repository";

const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;
export interface StatementLabels { statement: string; client: string; totalDue: string; pending: string; invoice: string; total: string; balance: string; dueDate: string; payments: string; date: string; amount: string }

// PDF del estado de cuenta desde los datos públicos → EntityReportPdf. Marca del RPC (logo→data-URI).
export async function statementDoc(d: PublicStatementResp, l: StatementLabels): Promise<ReactElement> {
  const { EntityReportPdf } = await import("@shared/pdf/EntityReportPdf");
  const tn = d.tenant!;
  const brand: PdfBrand = { name: tn.display_name || tn.legal_name || "NÚCLEO",
    logo: tn.logo_url ? await imgToDataUri(tn.logo_url) : null, primaryColor: tn.primary_color, accentColor: tn.accent_color };
  const infoRows = [{ label: l.client, value: d.customer_name ?? "" }, { label: l.totalDue, value: $(d.total_due ?? 0) }];
  const sections: ReconSection[] = [
    ...(d.invoices?.length ? [{ kind: "table" as const, title: l.pending, headers: [l.invoice, l.total, l.balance, l.dueDate],
      rows: d.invoices.map((i) => [i.invoice_number ?? "-", $(i.total), $(i.balance), i.due_date ?? "-"]) }] : []),
    ...(d.payments?.length ? [{ kind: "table" as const, title: l.payments, headers: [l.date, l.invoice, l.amount],
      rows: d.payments.map((p) => [p.date?.slice(0, 10) ?? "-", p.invoice_number ?? "-", $(p.amount)]) }] : []),
  ];
  return <EntityReportPdf data={{ title: `${l.statement} — ${brand.name}`, infoRows, sections }} brand={brand} />;
}
