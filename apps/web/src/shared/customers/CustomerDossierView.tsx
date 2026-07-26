import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Dossier } from "@shared/customers/customer-dossier";

// Secciones Órdenes / Facturas / Servicios / Tickets / Leads. La referencia izquierda es link a su detalle/módulo.
const LK = "text-primary hover:underline";
export function CustomerDossierView({ d }: { d: Dossier }) {
  const { t } = useI18n();
  const sec = (title: string, empty: string, rows: ReactNode[]) => (
    <div className="space-y-1 border-t border-border pt-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : rows}
    </div>
  );
  const row = (key: number, left: ReactNode, meta: string) => (
    <div key={key} className="flex justify-between gap-2 text-sm"><span className="truncate">{left}</span><span className="shrink-0 text-muted-foreground">{meta}</span></div>
  );
  return (
    <>
      {sec(t("cOrders"), t("cNoOrders"), d.orders.map((o, i) => row(i,
        o.id ? <Link to="/orders/$orderId" params={{ orderId: o.id }} className={LK}>{o.orderNumber || "—"} · {o.createdAt.slice(0, 10)}</Link> : `${o.orderNumber || "—"} · ${o.createdAt.slice(0, 10)}`,
        `${formatCurrency(o.total)} · ${o.status}`)))}
      {sec(t("cInvoices"), t("pNoInvoices"), d.invoices.map((iv, i) => row(i,
        iv.id ? <Link to="/billing" search={{ invoice: iv.id }} className={LK}>{iv.invoiceNumber || "—"}</Link> : (iv.invoiceNumber || "—"),
        `${formatCurrency(iv.total)} · ${iv.status}`)))}
      {sec(t("cServices"), t("pNoServices"), d.services.map((sv, i) => row(i,
        <Link to="/routes" search={{ customer: undefined, cname: undefined, cphone: undefined, caddr: undefined }} className={LK}>{sv.serviceType || "—"} · {sv.completedAt ? sv.completedAt.slice(0, 10) : "—"}</Link>, sv.status)))}
      {sec(t("cTickets"), t("pNoTickets"), d.tickets.map((tk, i) => row(i,
        <Link to="/support" className={LK}>{tk.subject}</Link>, `${tk.createdAt.slice(0, 10)} · ${tk.status}`)))}
      {sec(t("leads"), t("noRecords"), d.leads.map((l, i) => row(i,
        <Link to="/leads" className={LK}>{l.contactName} · {l.serviceRequested || "—"}</Link>, `${formatCurrency(l.quotedPrice)} · ${l.status}`)))}
    </>
  );
}
