import { FileDown, ArrowLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { publicInvoiceDoc } from "@billing/presentation/pdf/public-invoice-pdf";
import { InvoicePayButton } from "@billing/presentation/InvoicePayButton";
import type { PublicInvoiceResp } from "@billing/infrastructure/supabase-invoice-share.repository";

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

// Página pública branded de factura (patrón /aprobar). Marca del RPC (logo/colores del tenant). PDF client-side.
export function PublicInvoiceView({ data, token }: { data: PublicInvoiceResp; token?: string }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const inv = data.invoice; const tn = data.tenant;
  if (data.status !== "valid" || !inv || !tn) return <main className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">{t("pdfNotAvailable")}</main>;
  const labels = { invoice: t("invoice"), date: t("date"), dueDate: t("dueDate"), client: t("clientName"), description: t("description"),
    qty: t("quantity"), price: t("unitPrice"), total: t("total"), subtotal: t("subtotal"), tax: t("tax") };
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: tn.primary_color }}>
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-12 w-12 object-contain" />}
          <div><h1 className="text-xl font-bold" style={{ color: tn.primary_color }}>{tn.display_name || tn.legal_name}</h1>
            <p className="text-sm text-muted-foreground">{t("invoice")} {inv.invoice_number ?? ""}</p></div>
        </div>
        <div className="rounded-lg border border-border p-3 text-sm"><p className="font-bold">{inv.client_name}</p>
          {inv.phone && <p className="text-muted-foreground">{inv.phone}</p>}{inv.email && <p className="text-muted-foreground">{inv.email}</p>}</div>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs" style={{ color: tn.primary_color }}>
          <th className="p-1">{t("description")}</th><th className="p-1 text-right">{t("quantity")}</th><th className="p-1 text-right">{t("total")}</th></tr></thead>
          <tbody>{inv.items.map((it, i) => <tr key={i} className="border-t border-border"><td className="p-1">{it.description}</td><td className="p-1 text-right">{it.quantity}</td><td className="p-1 text-right">{money(it.line_total)}</td></tr>)}</tbody></table>
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{money(inv.subtotal)}</span></div>
          <div className="flex justify-between text-lg font-bold" style={{ color: tn.primary_color }}><span>{t("total")}</span><span>{money(inv.total)}</span></div>
        </div>
        {token && inv.status !== "paid" && <InvoicePayButton token={token} />}
        <div className="flex flex-wrap gap-3">
          <a href="/" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-bold text-foreground"><ArrowLeft className="h-4 w-4" /> {t("backToHome")}</a>
          <button type="button" disabled={generating} onClick={() => void exportPdf(() => publicInvoiceDoc(data, labels))} className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50" style={{ backgroundColor: tn.primary_color }}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>
        </div>
      </div>
    </main>
  );
}
