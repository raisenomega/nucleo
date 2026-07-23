import type { ReactNode } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import type { Dossier } from "@shared/customers/customer-dossier";

// Secciones Órdenes / Facturas / Servicios / Tickets (listas compactas, datos reales del cliente).
export function CustomerDossierView({ d }: { d: Dossier }) {
  const { t } = useI18n();
  const sec = (title: string, empty: string, rows: ReactNode[]) => (
    <div className="space-y-1 border-t border-border pt-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">{title}</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : rows}
    </div>
  );
  const line = (a: string, b: string, i: number) => <div key={i} className="flex justify-between gap-2 text-sm"><span className="truncate">{a}</span><span className="shrink-0 text-muted-foreground">{b}</span></div>;
  return (
    <>
      {sec(t("cOrders"), t("cNoOrders"), d.orders.map((o, i) => line(`${o.orderNumber || "—"} · ${o.createdAt.slice(0, 10)}`, `${formatCurrency(o.total)} · ${o.status}`, i)))}
      {sec(t("cInvoices"), t("pNoInvoices"), d.invoices.map((iv, i) => line(iv.invoiceNumber || "—", `${formatCurrency(iv.total)} · ${iv.status}`, i)))}
      {sec(t("cServices"), t("pNoServices"), d.services.map((sv, i) => line(`${sv.serviceType || "—"} · ${sv.completedAt ? sv.completedAt.slice(0, 10) : "—"}`, sv.status, i)))}
      {sec(t("cTickets"), t("pNoTickets"), d.tickets.map((tk, i) => line(tk.subject, `${tk.createdAt.slice(0, 10)} · ${tk.status}`, i)))}
      {sec(t("leads"), t("noRecords"), d.leads.map((l, i) => line(`${l.contactName} · ${l.serviceRequested || "—"}`, `${formatCurrency(l.quotedPrice)} · ${l.status}`, i)))}
    </>
  );
}
