import { FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdfExport } from "@shared/hooks/usePdfExport";
import { publicOrderDoc } from "@orders/presentation/pdf/public-order-pdf";
import type { PublicOrderResp } from "@orders/infrastructure/supabase-order-share.repository";

const money = (n: number) => `$${(n ?? 0).toFixed(2)}`;

// Página pública branded de orden (patrón /factura). Marca del RPC. PDF client-side con el detalle completo.
export function PublicOrderView({ data }: { data: PublicOrderResp }) {
  const { t } = useI18n();
  const { generating, exportPdf } = usePdfExport();
  const o = data.order; const tn = data.tenant;
  if (data.status !== "valid" || !o || !tn) return <main className="flex min-h-screen items-center justify-center p-4 text-center text-muted-foreground">{t("pdfNotAvailable")}</main>;
  const labels = { order: t("docOrder"), date: t("date"), client: t("ordCustomerTitle"), description: t("description"),
    qty: t("quantity"), price: t("unitPrice"), total: t("total"), subtotal: t("subtotal"), tax: t("tax") };
  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center gap-3 border-b-2 pb-3" style={{ borderColor: tn.primary_color }}>
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-12 w-12 object-contain" />}
          <div><h1 className="text-xl font-bold" style={{ color: tn.primary_color }}>{tn.display_name || tn.legal_name}</h1>
            <p className="text-sm text-muted-foreground">{t("docOrder")} {o.order_number ?? ""} · {o.status}</p></div>
        </div>
        <div className="rounded-lg border border-border p-3 text-sm"><p className="font-bold">{o.customer_name}</p>
          {[o.phone, o.email, o.address, o.billing_frequency].filter(Boolean).map((x, i) => <p key={i} className="text-muted-foreground">{x}</p>)}</div>
        <table className="w-full text-sm"><thead><tr className="text-left text-xs" style={{ color: tn.primary_color }}>
          <th className="p-1">{t("description")}</th><th className="p-1 text-right">{t("quantity")}</th><th className="p-1 text-right">{t("total")}</th></tr></thead>
          <tbody>{o.items.map((it, i) => <tr key={i} className="border-t border-border"><td className="p-1">{it.name}</td><td className="p-1 text-right">{it.qty}</td><td className="p-1 text-right">{money((it.price || 0) * it.qty)}</td></tr>)}</tbody></table>
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("subtotal")}</span><span>{money(o.subtotal)}</span></div>
          <div className="flex justify-between text-lg font-bold" style={{ color: tn.primary_color }}><span>{t("total")}</span><span>{money(o.total)}</span></div>
        </div>
        <button type="button" disabled={generating} onClick={() => void exportPdf(() => publicOrderDoc(data, labels))} className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-white disabled:opacity-50" style={{ backgroundColor: tn.primary_color }}><FileDown className="h-4 w-4" /> {t("downloadPdf")}</button>
      </div>
    </main>
  );
}
