import { X, MessageCircle, Mail, FileOutput, Check, Ban, FileDown } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { usePdf } from "@shared/hooks/usePdf";
import { formatCurrency } from "@shared/lib/format";
import { ScreenModal } from "@shared/components/ScreenModal";
import { QUOTE_ST_KEY, QUOTE_ST_COLOR } from "@quotes/presentation/quote-ui";
import type { Quote, QuoteStatus } from "@quotes/domain/quote.types";

const wa = (q: Quote, msg: string) => `https://wa.me/${(q.clientPhone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

// Detalle cotización (ScreenModal): items + [WhatsApp] [Email] [Convertir] [Aceptar/Rechazar].
export function QuoteDetail({ quote, canManage, onStatus, onConvert, onClose }: {
  quote: Quote; canManage: boolean; onStatus: (s: QuoteStatus) => void; onConvert: () => void; onClose: () => void;
}) {
  const { t } = useI18n();
  const pdf = usePdf();
  const q = quote;
  const open = q.status === "draft" || q.status === "sent" || q.status === "viewed";
  const msg = `${t("quotes")} ${q.quoteNumber ?? ""} — ${formatCurrency(q.total)}`;
  const btn = "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-primary">{q.clientName}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{q.quoteNumber ?? "—"}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${QUOTE_ST_COLOR[q.status]}`}>{t(QUOTE_ST_KEY[q.status])}</span>
        </div>
        <div className="rounded-lg border border-border">
          {q.items.map((it, idx) => (
            <div key={idx} className="flex justify-between border-b border-border px-3 py-1 text-sm last:border-0">
              <span>{it.description} ×{it.quantity}</span><span className="font-semibold">{formatCurrency(it.lineTotal)}</span></div>))}
          <div className="flex justify-between px-3 py-1 text-sm font-bold text-primary"><span>{t("grandTotal")}</span><span>{formatCurrency(q.total)}</span></div>
        </div>
        {q.validUntil && <p className="text-sm"><span className="font-bold">{t("validUntil")}: </span>{q.validUntil}</p>}
        {q.terms && <p className="text-xs text-muted-foreground"><span className="font-bold">{t("terms")}: </span>{q.terms}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={pdf.generating} onClick={() => void pdf.generatePdf("quote", q.id)}
            className={`${btn} bg-secondary disabled:opacity-50`}><FileDown className="h-4 w-4" /> {pdf.generating ? t("generatingPdf") : t("downloadPdf")}</button>
          {q.clientPhone && <a href={wa(q, msg)} target="_blank" rel="noreferrer" className={`${btn} bg-green-600 text-white`}><MessageCircle className="h-4 w-4" /> {t("whatsapp")}</a>}
          {q.clientEmail && <a href={`mailto:${q.clientEmail}?subject=${encodeURIComponent(msg)}`} className={`${btn} bg-secondary`}><Mail className="h-4 w-4" /> {t("sendEmail")}</a>}
          {canManage && q.status === "accepted" && <button type="button" onClick={onConvert} className={`${btn} bg-primary text-primary-foreground`}><FileOutput className="h-4 w-4" /> {t("convertToInvoice")}</button>}
          {canManage && open && <button type="button" onClick={() => onStatus("accepted")} className={`${btn} bg-green-600 text-white`}><Check className="h-4 w-4" /> {t("markAccepted")}</button>}
          {canManage && open && <button type="button" onClick={() => onStatus("rejected")} className={`${btn} bg-destructive text-white`}><Ban className="h-4 w-4" /> {t("markRejected")}</button>}
        </div>
      </div>
    </ScreenModal>
  );
}
