import { FileDown, ArrowLeft } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { publicDeliveryDoc } from "@sales/presentation/pdf/public-delivery-pdf";
import type { PublicDeliveryResp } from "@sales/infrastructure/supabase-delivery-share.repository";

// Página pública branded del conduce (patrón /orden). Marca del RPC. Firma inline; PDF client-side.
export function PublicDeliveryView({ data }: { data: PublicDeliveryResp }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const n = data.note; const tn = data.tenant;
  if (data.status !== "valid" || !n || !tn) return <main className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">{t("pdfNotAvailable")}</main>;
  const labels = { conduce: t("conduce"), fromSalesOrder: t("fromSalesOrder"), dispatchDate: t("dispatchDate"),
    client: t("clientName"), description: t("description"), qty: t("qtyDispatched"), receivedBy: t("receivedBy"), shippingNotes: t("shippingNotes") };
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: tn.primary_color }}>
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-12 w-12 object-contain" />}
          <div><h1 className="text-xl font-bold" style={{ color: tn.primary_color }}>{tn.display_name || tn.legal_name}</h1>
            <p className="text-sm text-muted-foreground">{t("conduce")} {n.note_number} · {n.status}{n.so_number ? ` · ${n.so_number}` : ""}</p></div>
        </div>
        <div className="rounded-lg border border-border p-3 text-sm"><p className="font-bold">{n.customer_name}</p>
          {[n.shipping_address, n.dispatch_date].filter(Boolean).map((x, i) => <p key={i} className="text-muted-foreground">{x}</p>)}</div>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs" style={{ color: tn.primary_color }}>
          <th className="p-1">{t("description")}</th><th className="p-1 text-right">{t("qtyDispatched")}</th></tr></thead>
          <tbody>{n.items.map((it, i) => <tr key={i} className="border-t border-border"><td className="p-1">{it.description}</td><td className="p-1 text-right">{it.qty}</td></tr>)}</tbody></table>
        {n.received_by && <p className="text-sm"><span className="font-bold">{t("receivedBy")}: </span>{n.received_by}</p>}
        {n.signature && <div><p className="text-xs font-bold text-muted-foreground">{t("signature")}</p><img src={n.signature} alt="" className="h-20 rounded border border-border bg-white" /></div>}
        <div className="flex flex-wrap gap-3">
          <a href="/" className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 font-bold text-foreground"><ArrowLeft className="h-4 w-4" /> {t("backToHome")}</a>
          <button type="button" disabled={generating} onClick={() => void exportPdf(() => publicDeliveryDoc(data, labels))} className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50" style={{ backgroundColor: tn.primary_color }}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>
        </div>
      </div>
    </main>
  );
}
