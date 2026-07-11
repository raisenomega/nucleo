import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import { EvidenceUpload } from "@finance/presentation/EvidenceUpload";
import { STATUSES, TST_KEY, TST_COLOR, PRIO_KEY, PRIO_COLOR } from "@hr/presentation/support-ui";
import type { TicketDetail as TD, TicketStatus } from "@hr/domain/support.types";

type Emp = { id: string; full_name: string };

export function TicketDetail({ ticket, employees, names, tenantId, canManage, currentUserId, onStatus, onAssign, onComment, onClose }: {
  ticket: TD; employees: Emp[]; names: Record<string, string>; tenantId: string; canManage: boolean; currentUserId: string;
  onStatus: (s: TicketStatus) => void; onAssign: (to: string | null) => void; onComment: (content: string, evidence: string[]) => Promise<void>; onClose: () => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [ev, setEv] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  async function send() { if (!text.trim()) return; setBusy(true); await onComment(text.trim(), ev); setText(""); setEv([]); setBusy(false); }
  const fld = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{ticket.subject}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${PRIO_COLOR[ticket.priority]}`}>{t(PRIO_KEY[ticket.priority])}</span>
          <span className={`rounded px-2 py-0.5 text-xs font-bold ${TST_COLOR[ticket.status]}`}>{t(TST_KEY[ticket.status])}</span>
          {ticket.categoryLabel && <span className="text-xs text-muted-foreground">{ticket.categoryLabel}</span>}
        </div>
        {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
        {canManage && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select value={ticket.status} onChange={(e) => onStatus(e.target.value as TicketStatus)} className={fld}>
              {STATUSES.map((s) => <option key={s} value={s}>{t(TST_KEY[s])}</option>)}</select>
            <select value={ticket.assignedTo ?? ""} onChange={(e) => onAssign(e.target.value || null)} className={fld}>
              <option value="">{t("unassigned")}</option>{employees.map((x) => <option key={x.id} value={x.id}>{x.full_name}</option>)}</select>
            <button type="button" onClick={() => onAssign(currentUserId)} className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-foreground md:col-span-2">{t("takeTicket")}</button>
          </div>)}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("comments")}</p>
          {ticket.comments.map((c) => (
            <div key={c.id} className="rounded-lg border border-border p-2 text-sm">
              <div className="flex justify-between text-xs text-muted-foreground"><span>{names[c.authorId] ?? "—"}</span><span>{c.createdAt.slice(0, 10)}</span></div>
              <p className="mt-1">{c.content}</p>
              {c.evidenceUrls.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer" className="mr-2 text-xs text-primary underline">{t("attachment")} {i + 1}</a>)}
            </div>))}
        </div>
        <div className="space-y-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("addComment")} rows={2} className={fld} />
          <EvidenceUpload tenantId={tenantId} value={ev} onChange={setEv} />
          <button type="button" disabled={busy} onClick={() => void send()} className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-sm font-bold disabled:opacity-50">{t("send")}</button>
        </div>
      </div>
    </ScreenModal>
  );
}
