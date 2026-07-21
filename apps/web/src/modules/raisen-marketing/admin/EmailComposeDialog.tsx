import { useState } from "react";

const F = "w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground";

// Redactar email (compartido por el inbox de leads y el de reservas): Para (readonly) + CC + BCC + asunto +
// mensaje → Resend vía RPC. Error honesto visible (dominio no verificado / CC inválido). Solo cierra al ok.
export function EmailComposeDialog({ toName, toEmail, defaultSubject, onClose, onSend }: {
  toName: string; toEmail: string; defaultSubject: string; onClose: () => void;
  onSend: (subject: string, body: string, cc: string, bcc: string) => Promise<{ ok: boolean; message?: string }>;
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const send = async () => {
    setSending(true); setError("");
    const r = await onSend(subject, body, cc, bcc);
    setSending(false);
    if (!r.ok) setError(r.message || "No se pudo enviar.");
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-md space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold text-foreground">Email a {toName}</h2>
        <label className="block text-xs text-muted-foreground">Para<input className={`${F} opacity-70`} value={toEmail} readOnly /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs text-muted-foreground">CC (opcional)<input className={F} placeholder="cc@ejemplo.com" value={cc} onChange={(e) => setCc(e.target.value)} /></label>
          <label className="block text-xs text-muted-foreground">CCO / BCC (opcional)<input className={F} placeholder="bcc@ejemplo.com" value={bcc} onChange={(e) => setBcc(e.target.value)} /></label>
        </div>
        <label className="block text-xs text-muted-foreground">Asunto<input className={F} maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} /></label>
        <label className="block text-xs text-muted-foreground">Mensaje<textarea className={F} rows={7} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} /></label>
        {error && <p className="rounded bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={sending || !subject.trim() || !body.trim()} onClick={() => void send()} className="flex-1 rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">{sending ? "Enviando…" : "Enviar"}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-secondary px-4 py-2 text-sm text-foreground">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
