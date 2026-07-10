import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { formatCurrency } from "@shared/lib/format";
import { respondQuote, type PublicQuoteResp } from "@quotes/infrastructure/supabase-public-quote.repository";

// Estado 'valid': branding del tenant + detalle + PDF + aceptar/rechazar + confirmación post-respuesta.
export function QuoteApprovalView({ token, data }: { token: string; data: PublicQuoteResp }) {
  const { t } = useI18n();
  const q = data.quote!; const tn = data.tenant!;
  const [done, setDone] = useState<"accepted" | "rejected" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const pdfOk = !!data.pdf_url && !!data.pdf_url_expires_at && data.pdf_url_expires_at > new Date().toISOString();

  async function respond(decision: "accepted" | "rejected") {
    setBusy(true);
    const r = await respondQuote(token, decision, note);
    setBusy(false);
    if (r.status === "ok") setDone(decision); else window.alert(t("respondError"));
  }

  if (done) return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
      <div className="space-y-2">
        <p className="text-2xl font-bold text-primary">{done === "accepted" ? t("quoteAcceptedThanks") : t("quoteRejectedThanks")}</p>
        <p className="font-bold">{tn.display_name}</p>
        {tn.contact_phone && <p className="text-muted-foreground">{tn.contact_phone}</p>}
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="flex items-center gap-3 border-b pb-3" style={{ borderColor: tn.primary_color }}>
          {tn.logo_url && <img src={tn.logo_url} alt="" className="h-11" />}
          <h1 className="text-xl font-bold" style={{ color: tn.primary_color }}>{tn.display_name ?? tn.legal_name}</h1>
        </header>
        <p className="text-sm"><span className="font-bold">{q.client_name}</span> · {q.quote_number}</p>
        <div className="rounded-lg border border-border">
          {q.items.map((it, i) => (
            <div key={i} className="flex justify-between border-b border-border px-3 py-1 text-sm last:border-0">
              <span>{it.description} ×{it.quantity}</span><span className="font-semibold">{formatCurrency(it.line_total)}</span></div>))}
          <div className="flex justify-between px-3 py-1 text-sm font-bold" style={{ color: tn.primary_color }}>
            <span>{t("grandTotal")}</span><span>{formatCurrency(q.total)}</span></div>
        </div>
        {q.valid_until && <p className="text-sm"><b>{t("validUntil")}:</b> {q.valid_until}</p>}
        {q.terms && <p className="text-xs text-muted-foreground"><b>{t("terms")}:</b> {q.terms}</p>}
        {pdfOk
          ? <a href={data.pdf_url ?? "#"} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-secondary px-4 py-2 text-sm font-bold">{t("downloadPdf")}</a>
          : <p className="text-xs text-muted-foreground">{t("pdfNotAvailable")} {tn.display_name} {tn.contact_phone ?? ""}</p>}
        <div className="flex gap-3 pt-2">
          <button type="button" disabled={busy} onClick={() => void respond("accepted")} className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{t("acceptQuote")}</button>
          <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50">{t("rejectQuote")}</button>
        </div>
        {rejecting && <div className="space-y-2">
          <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("rejectReason")} rows={2} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
          <button type="button" disabled={busy} onClick={() => void respond("rejected")} className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">{t("rejectQuote")}</button>
        </div>}
      </div>
    </main>
  );
}
