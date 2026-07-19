import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { ScreenModal } from "@shared/components/ScreenModal";
import { listMessages, replyTicket } from "@shared/portal/ticket.repository";
import type { CustomerTicket, TicketMessage } from "@shared/portal/ticket.types";

// Hilo del ticket (chat cliente↔negocio) + responder. Mis mensajes a la derecha.
export function TicketThread({ ticket, onClose }: { ticket: CustomerTicket; onClose: () => void }) {
  const { t } = useI18n(); const { session } = useSession();
  const [msgs, setMsgs] = useState<TicketMessage[]>([]); const [text, setText] = useState("");
  const load = () => { void listMessages(ticket.id).then(setMsgs); };
  useEffect(load, [ticket.id]);
  const send = async () => { if (!text.trim()) return; const ok = await replyTicket(ticket.id, text); if (ok) { setText(""); load(); } };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{ticket.subject}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-2 p-4">
        {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-lg p-2 text-sm ${m.authorId === session?.userId ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>{m.content}</div>
        ))}
        <div className="flex gap-2 pt-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("pReply")} className="flex-1 rounded-lg border border-border bg-background p-2 text-sm" />
          <button type="button" onClick={() => void send()} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-bold">{t("pSend")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
