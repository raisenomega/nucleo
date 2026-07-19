import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { usePortal } from "@shared/portal/portal-context";
import { useCustomerTickets } from "@shared/portal/useCustomerTickets.hook";
import { NewTicketForm } from "@shared/portal/NewTicketForm";
import { TicketThread } from "@shared/portal/TicketThread";

export const Route = createFileRoute("/portal/_app/support")({ component: PortalSupport });
const STATUS: Record<string, TranslationKey> = { open: "tkOpen", in_progress: "tkInProgress", resolved: "tkResolved", closed: "tkClosed" };

function PortalSupport() {
  const { t } = useI18n();
  const { customer } = usePortal();
  const tk = useCustomerTickets(customer.tenantId);
  const [open, setOpen] = useState<string | null>(null); const [creating, setCreating] = useState(false);
  const sel = tk.tickets.find((x) => x.id === open);
  const create = (s: string, d: string, p: string) => void tk.create(s, d, p).then(() => setCreating(false));
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("navSupport")}</h1>
        <button type="button" onClick={() => setCreating(true)} className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-sm font-bold">{t("pNewTicket")}</button>
      </div>
      {creating && <NewTicketForm onSubmit={create} onCancel={() => setCreating(false)} />}
      {tk.tickets.length === 0 && !creating && <p className="text-sm text-muted-foreground">{t("pNoTickets")}</p>}
      {tk.tickets.map((x) => (
        <button key={x.id} type="button" onClick={() => setOpen(x.id)} className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-3 text-left">
          <span><span className="font-bold text-foreground">{x.subject}</span><span className="block text-xs text-muted-foreground">{x.createdAt.slice(0, 10)}</span></span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{t(STATUS[x.status] ?? "tkOpen")}</span>
        </button>
      ))}
      {sel && <TicketThread ticket={sel} onClose={() => setOpen(null)} />}
    </div>
  );
}
