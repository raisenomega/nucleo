import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Dossier } from "@shared/customers/customer-dossier";

// Secciones Órdenes / Facturas / Cotizaciones / Servicios / Tickets / Leads. La referencia izquierda linkea a su detalle/módulo.
const LK = "text-primary hover:underline";
const QST: Record<string, { key: TranslationKey; cls: string }> = {
  draft: { key: "qsDraft", cls: "bg-secondary text-muted-foreground" }, sent: { key: "qsSent", cls: "bg-blue-500/10 text-blue-600" },
  viewed: { key: "qsViewed", cls: "bg-indigo-500/10 text-indigo-600" }, accepted: { key: "qsAccepted", cls: "bg-green-500/10 text-green-600" },
  rejected: { key: "qsRejected", cls: "bg-red-500/10 text-red-600" }, expired: { key: "qsExpired", cls: "bg-orange-500/10 text-orange-600" },
  converted: { key: "qsConverted", cls: "bg-primary/15 text-primary" },
};
export function CustomerDossierView({ d }: { d: Dossier }) {
  const { t } = useI18n();
  const sec = (title: string, empty: string, rows: ReactNode[]) => (
    <div className="space-y-1 border-t border-border pt-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : rows}
    </div>
  );
  const row = (key: number, left: ReactNode, meta: ReactNode) => (
    <div key={key} className="flex justify-between gap-2 text-sm"><span className="truncate">{left}</span><span className="flex shrink-0 items-center gap-1 text-muted-foreground">{meta}</span></div>
  );
  return (
    <>
      {sec(t("cInvoices"), t("pNoInvoices"), d.invoices.map((iv, i) => row(i,
        iv.id ? <Link to="/billing" search={{ invoice: iv.id }} className={LK}>{iv.invoiceNumber || "—"}</Link> : (iv.invoiceNumber || "—"),
        `${formatCurrency(iv.total)} · ${iv.status}`)))}
      {sec(t("quotes"), t("noQuotes"), d.quotes.map((q, i) => { const m = QST[q.status] ?? { key: "qsDraft" as const, cls: "bg-secondary text-muted-foreground" }; return row(i,
        <Link to="/quotes" search={{ quote: q.id }} className={LK}>{q.quoteNumber || "—"} · {q.createdAt.slice(0, 10)}</Link>,
        <>{formatCurrency(q.total)}<span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${m.cls}`}>{t(m.key)}</span>{q.linkedInvoiceId && <Link to="/billing" search={{ invoice: q.linkedInvoiceId }} className={LK}>→ {t("invoice")}</Link>}</>); }))}
      {sec(t("cServices"), t("pNoServices"), d.services.map((sv, i) => row(i,
        <Link to="/routes" search={{ customer: undefined, cname: undefined, cphone: undefined, caddr: undefined }} className={LK}>{sv.serviceType || "—"} · {sv.completedAt ? sv.completedAt.slice(0, 10) : "—"}</Link>, sv.status)))}
      {sec(t("cTickets"), t("pNoTickets"), d.tickets.map((tk, i) => row(i,
        <Link to="/support" className={LK}>{tk.subject}</Link>, `${tk.createdAt.slice(0, 10)} · ${tk.status}`)))}
      {sec(t("leads"), t("noRecords"), d.leads.map((l, i) => row(i,
        <Link to="/leads" className={LK}>{l.contactName} · {l.serviceRequested || "—"}</Link>, `${formatCurrency(l.quotedPrice)} · ${l.status}`)))}
    </>
  );
}
