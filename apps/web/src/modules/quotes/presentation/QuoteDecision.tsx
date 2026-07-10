import { useState } from "react";
import { useI18n } from "@shared/i18n";
import { respondQuote } from "@quotes/infrastructure/supabase-public-quote.repository";

// Sección PDF prominente + separación + decisión (aceptar/rechazar) de la página /aprobar.
export function QuoteDecision({ token, tenantName, contactPhone, pdfUrl, pdfOk, onDone }: {
  token: string; tenantName: string; contactPhone: string | null; pdfUrl: string | null; pdfOk: boolean;
  onDone: (d: "accepted" | "rejected") => void;
}) {
  const { t } = useI18n();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function respond(decision: "accepted" | "rejected") {
    setBusy(true);
    const r = await respondQuote(token, decision, note);
    setBusy(false);
    if (r.status === "ok") onDone(decision); else window.alert(t("respondError"));
  }

  return (
    <div className="space-y-4">
      {pdfOk
        ? <div className="text-center">
            <a href={pdfUrl ?? "#"} target="_blank" rel="noreferrer"
              className="inline-block rounded-xl border-2 border-primary bg-secondary px-8 py-4 text-lg font-bold">📄 {t("downloadPdf")}</a>
            <p className="mt-2 text-sm text-muted-foreground">{t("quoteReviewPdfFirst")}</p>
          </div>
        : <p className="text-sm text-muted-foreground">{t("quotePdfUnavailable", { name: tenantName, phone: contactPhone ?? "" })}</p>}
      <hr className="my-8 border-border" />
      <p className="text-center text-lg font-semibold">{t("quoteAcceptQuestion")}</p>
      <div className="flex gap-4">
        <button type="button" disabled={busy} onClick={() => void respond("accepted")}
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-bold text-white disabled:opacity-50">{t("acceptQuote")}</button>
        <button type="button" disabled={busy} onClick={() => setRejecting(true)}
          className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50">{t("rejectQuote")}</button>
      </div>
      {rejecting && <div className="space-y-2">
        <textarea maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("rejectReason")} rows={2}
          className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
        <button type="button" disabled={busy} onClick={() => void respond("rejected")}
          className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white disabled:opacity-50">{t("rejectQuote")}</button>
      </div>}
    </div>
  );
}
