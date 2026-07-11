import { useState } from "react";
import { X, Send } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { formatCurrency } from "@shared/lib/format";
import { useQuoteSend } from "@quotes/presentation/useQuoteSend";
import type { Quote } from "@quotes/domain/quote.types";

const waLink = (phone: string | null, text: string) =>
  `https://wa.me/${(phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

// Diálogo de envío: WhatsApp (default) + Email + mensaje opcional. Opción A defensiva sobre email vacío.
export function SendQuoteDialog({ quote: q, tenantId, onClose, onSent }: {
  quote: Quote; tenantId: string; onClose: () => void; onSent: () => void;
}) {
  const { t } = useI18n(); const toast = useToast();
  const { send, sending } = useQuoteSend(tenantId);
  const [wa, setWa] = useState(!!q.clientPhone);
  const [em, setEm] = useState(false);
  const [msg, setMsg] = useState("");
  const resend = !!q.sentAt;
  const stale = !!q.sentAt && !!q.updatedAt && q.updatedAt > q.sentAt;
  const cb = "flex items-center gap-2 text-sm";

  async function confirm() {
    let channels = [...(wa ? ["whatsapp"] : []), ...(em ? ["email"] : [])];
    if (em && (!q.clientEmail || q.clientEmail.trim() === "")) {
      toast.info(t("noEmailWarning")); channels = channels.filter((c) => c !== "email");
    }
    if (channels.length === 0) { toast.error(t("noChannels")); return; }
    const r = await send(q.id, channels, msg);
    if (!r) { toast.error(t("sendError")); return; }
    if (wa) {
      const text = `${msg ? msg + "\n\n" : ""}${t("quote")} ${q.quoteNumber ?? ""} — ${formatCurrency(q.total)}\n\n${t("viewAndRespond")}:\n${r.approvalUrl}`;
      window.open(waLink(q.clientPhone, text), "_blank", "noopener");
    }
    toast.success(t("sentOk")); onSent();
  }

  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{resend ? t("resendQuote") : t("sendQuote")}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        {q.sentAt && <p className="text-xs text-muted-foreground">{t("lastSentOn")} {q.sentAt.slice(0, 10)} · {q.sentChannels.join(", ")}</p>}
        {stale && <p className="rounded bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{t("editedAfterSent")}</p>}
        <label className={cb}><input type="checkbox" checked={wa} disabled={!q.clientPhone} onChange={(e) => setWa(e.target.checked)} /> WhatsApp</label>
        <label className={cb}><input type="checkbox" checked={em} disabled={!q.clientEmail} onChange={(e) => setEm(e.target.checked)} /> Email</label>
        <textarea maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("personalMessage")} rows={3}
          className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
        <button type="button" disabled={sending || (!wa && !em)} onClick={() => void confirm()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
          <Send className="h-4 w-4" /> {sending ? t("sending") : resend ? t("resend") : t("send")}
        </button>
      </div>
    </ScreenModal>
  );
}
