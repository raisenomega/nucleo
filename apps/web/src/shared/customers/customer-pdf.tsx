import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ReconSection } from "@shared/pdf/ReconciliationPdf";
import { getCustomerAr } from "@shared/customers/ar.repository";
import { listCustomerPayments } from "@shared/customers/customer-payments.repository";
import { listCustomerOrders } from "@shared/customers/customer-orders.repository";
import { getCustomerTimeline } from "@shared/customers/customer-timeline.repository";
import type { AdminCustomer } from "@shared/customers/customers-agg";

type T = (k: TranslationKey) => string;
const $ = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const st = (active: boolean, t: T) => (active ? t("cActiveSt") : t("cInactiveSt"));

// Reporte 360 del cliente: fetch de AR/pagos/órdenes/timeline + caja de datos + secciones → EntityReportPdf.
export async function customerDoc(c: AdminCustomer, tenantId: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { EntityReportPdf } = await import("@shared/pdf/EntityReportPdf");
  const [ar, pays, orders, tl] = await Promise.all([getCustomerAr(c.id),
    listCustomerPayments(tenantId, c.userId, c.email), listCustomerOrders(tenantId, c.userId, c.email), getCustomerTimeline(c.id, 20, 0)]);
  const infoRows = [{ label: t("name"), value: c.fullName }, { label: t("email"), value: c.email || "-" },
    { label: t("phone"), value: c.phone || "-" }, { label: t("source"), value: c.source || "-" },
    { label: t("status"), value: st(c.isActive, t) }, { label: t("registeredDate"), value: c.createdAt?.slice(0, 10) ?? "-" }];
  const sections: ReconSection[] = [
    { kind: "kpi", kpis: [{ label: t("pTotalOwed"), value: $(ar.totalDue) }, { label: t("cOrders"), value: c.ordersCount }, { label: t("cBilled"), value: $(c.totalBilled) }] },
    ...(ar.invoices.length ? [{ kind: "table" as const, title: t("statement"), headers: [t("invoiceNumber"), t("total"), t("balance"), t("dueDate"), t("status")],
      rows: ar.invoices.map((i) => [i.invoiceNumber ?? "-", $(i.total), $(i.balance), i.dueDate ?? "-", i.status]) }] : []),
    ...(pays.length ? [{ kind: "table" as const, title: t("pPaymentHistory"), headers: [t("date"), t("invoiceNumber"), t("amount"), t("paymentMethod")],
      rows: pays.map((p) => [p.paymentDate?.slice(0, 10) ?? "-", p.invoiceNumber, $(p.amount), p.method ?? "-"]) }] : []),
    ...(orders.length ? [{ kind: "table" as const, title: t("orders"), headers: [t("orderNumber"), t("total"), t("status"), t("date")],
      rows: orders.map((o) => [o.orderNumber, $(o.total), o.status, o.createdAt?.slice(0, 10) ?? "-"]) }] : []),
    ...(tl.length ? [{ kind: "table" as const, title: t("activity"), headers: [t("date"), t("title")],
      rows: tl.map((e) => [e.eventDate?.slice(0, 10) ?? "-", `${e.title}${e.subtitle ? ` · ${e.subtitle}` : ""}`]) }] : []),
  ];
  return <EntityReportPdf data={{ title: `${t("docCustomer")} — ${c.fullName}`, infoRows, notes: c.notesForTeam, notesLabel: t("cInternalNote"), sections }} brand={brand} />;
}

export async function clientListDoc(clients: readonly AdminCustomer[], filterLabel: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReportPdf } = await import("@shared/pdf/ReportPdf");
  const body = { title: `${t("docClientList")} · ${filterLabel}`,
    kpis: [{ label: t("totalClients"), value: clients.length }, { label: t("totalDebt"), value: $(clients.reduce((s, c) => s + c.debt, 0)) }],
    tables: [{ title: filterLabel, headers: [t("name"), t("email"), t("phone"), t("status"), t("balance"), t("source")],
      rows: clients.map((c) => [c.fullName, c.email || "-", c.phone || "-", st(c.isActive, t), $(c.debt), c.source || "-"]) }] };
  return <ReportPdf body={body} brand={brand} />;
}
