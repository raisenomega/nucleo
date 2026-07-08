import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useSession } from "@shared/providers/SessionProvider";
import { useSupport } from "@hr/application/useSupport.hook";
import { supabaseSupportRepository } from "@hr/infrastructure/supabase-support.repository";
import { TicketForm } from "@hr/presentation/TicketForm";
import { TicketTable } from "@hr/presentation/TicketTable";
import { TicketDetail } from "@hr/presentation/TicketDetail";
import { TST_KEY } from "@hr/presentation/support-ui";
import type { TicketDetail as TD, TicketStatus } from "@hr/domain/support.types";

export const Route = createFileRoute("/_authenticated/support")({ component: SupportPage });
type Emp = { id: string; full_name: string };
const KPIS = ["open", "in_progress", "resolved", "closed"] as const;

function SupportPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { session } = useSession();
  const m = useSupport(supabaseSupportRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<TD | null>(null);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);
  const names = useMemo(() => Object.fromEntries(emps.map((e) => [e.id, e.full_name])), [emps]);
  if (!can("support", "view")) return <Navigate to="/dashboard" />;
  const reload = (id: string) => void m.detail(id).then((d) => setViewing(d));
  const view = (id: string) => void m.detail(id).then((d) => { if (d) setViewing(d); });
  const onStatus = (s: TicketStatus) => { if (viewing) void m.setStatus(viewing.id, s).then(() => reload(viewing.id)); };
  const onAssign = (to: string | null) => { if (viewing) void m.assign(viewing.id, to).then(() => reload(viewing.id)); };
  const onComment = async (content: string, ev: string[]) => { if (viewing) { await m.addComment(viewing.id, content, ev); reload(viewing.id); } };
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("support")}</h1>
          {can("support", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
            <Plus className="h-4 w-4" /> {t("newTicket")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("supportSubtitle")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{KPIS.map((k) => (
        <div key={k} className="rounded-xl border border-border bg-card p-3">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t(TST_KEY[k])}</span>
          <p className="text-2xl font-bold text-primary">{m.summary[k]}</p></div>))}</div>
      {creating && <TicketForm onSubmit={m.create} onCancel={() => setCreating(false)} />}
      <TicketTable rows={m.list} onView={view} />
      {viewing && <TicketDetail ticket={viewing} employees={emps} names={names} tenantId={session?.tenantId ?? ""}
        canManage={can("support", "edit")} currentUserId={session?.userId ?? ""}
        onStatus={onStatus} onAssign={onAssign} onComment={onComment} onClose={() => setViewing(null)} />}
    </div>
  );
}
