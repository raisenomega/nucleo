import { FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { statementDoc } from "@shared/customers/statement-pdf";
import type { PublicStatementResp } from "@shared/customers/customer-statement.repository";

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

// Página pública branded de estado de cuenta (patrón /factura). Marca del RPC. PDF client-side.
export function PublicStatementView({ data }: { data: PublicStatementResp }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const tn = data.tenant;
  if (data.status !== "valid" || !tn) return <main className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">{t("pdfNotAvailable")}</main>;
  const labels = { statement: t("statement"), client: t("clientName"), totalDue: t("pTotalOwed"), pending: t("pendingDebts"),
    invoice: t("invoiceNumber"), total: t("total"), balance: t("balance"), dueDate: t("dueDate"), payments: t("pPaymentHistory"), date: t("date"), amount: t("amount") };
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: tn.primary_color }}>
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-12 w-12 object-contain" />}
          <div><h1 className="text-xl font-bold" style={{ color: tn.primary_color }}>{tn.display_name || tn.legal_name}</h1>
            <p className="text-sm text-muted-foreground">{t("statement")} · {data.customer_name}</p></div>
        </div>
        <div className="rounded-lg border border-border p-4 text-center">
          <p className="text-xs font-bold uppercase text-muted-foreground">{t("pTotalOwed")}</p>
          <p className="text-3xl font-bold" style={{ color: tn.primary_color }}>{money(data.total_due ?? 0)}</p></div>
        {data.invoices && data.invoices.length > 0 && <table className="w-full text-sm"><thead><tr className="text-left text-xs" style={{ color: tn.primary_color }}>
          <th className="p-1">{t("invoiceNumber")}</th><th className="p-1 text-right">{t("balance")}</th><th className="p-1 text-right">{t("dueDate")}</th></tr></thead>
          <tbody>{data.invoices.map((i, k) => <tr key={k} className="border-t border-border"><td className="p-1">{i.invoice_number ?? "-"}</td><td className="p-1 text-right">{money(i.balance)}</td><td className="p-1 text-right">{i.due_date ?? "-"}</td></tr>)}</tbody></table>}
        <button type="button" disabled={generating} onClick={() => void exportPdf(() => statementDoc(data, labels))} className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50" style={{ backgroundColor: tn.primary_color }}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>
        {tn.contact_phone && <p className="text-center text-xs text-muted-foreground">{tn.display_name} · {tn.contact_phone}</p>}
      </div>
    </main>
  );
}
