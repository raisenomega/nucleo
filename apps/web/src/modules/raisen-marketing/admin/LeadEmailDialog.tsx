import { useState } from "react";
import type { MarketingLead } from "@raisen-marketing/data/lead-form.types";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Enviar un email al lead (asunto + cuerpo) vía RPC _marketing_email_lead (Resend). Error honesto de Resend
// visible (dominio no verificado / no configurado). Nunca "Enviado" falso: solo cierra al ok.
export function LeadEmailDialog({ lead, onClose, onSend }: { lead: MarketingLead; onClose: () => void; onSend: (subject: string, body: string) => Promise<{ ok: boolean; message?: string }> }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    setSending(true); setError("");
    const r = await onSend(subject, body);
    setSending(false);
    if (!r.ok) setError(r.message || "No se pudo enviar.");
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">Email a {lead.customerName}</h2>
        <p className="text-sm text-muted-foreground">Se enviará a: <strong className="text-foreground">{lead.customerEmail}</strong></p>
        <input className={F} placeholder="Asunto" maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className={F} rows={6} maxLength={5000} placeholder="Mensaje" value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={sending || !subject.trim() || !body.trim()} onClick={() => void send()} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{sending ? "Enviando…" : "Enviar email"}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
