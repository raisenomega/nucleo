import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useToast } from "@shared/providers/toast-context";
import { useLeave } from "@hr/application/useLeave.hook";
import { supabaseLeaveRepository } from "@hr/infrastructure/supabase-leave.repository";
import { LeaveRequestsTable } from "@hr/presentation/LeaveRequestsTable";
import { LeaveBalancesTable } from "@hr/presentation/LeaveBalancesTable";
import { PendingApprovalTab } from "@hr/presentation/PendingApprovalTab";
import { TeamCalendar } from "@hr/presentation/TeamCalendar";
import { LeaveRequestModal } from "@hr/presentation/LeaveRequestModal";
import { RejectLeaveModal } from "@hr/presentation/RejectLeaveModal";
import type { AttResult } from "@hr/domain/attendance.types";

type Tab = "mine" | "pending" | "balances" | "calendar";

export function LeavePage() {
  const { t } = useI18n();
  const { session } = useSession();
  const { canEdit } = useRoleGate();
  const toast = useToast();
  const userId = session?.userId ?? "";
  const isStaff = canEdit("coo");
  const m = useLeave(supabaseLeaveRepository, userId, isStaff);
  const [tab, setTab] = useState<Tab>("mine");
  const [reqOpen, setReqOpen] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const act = (p: Promise<AttResult>) => void p.then((r) => { if (!r.ok) toast.error(r.error); });
  const tc = (x: Tab) => `whitespace-nowrap px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("leave")}</h1>
        <button type="button" onClick={() => setReqOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> {t("requestLeave")}</button>
      </div>
      <div className="flex gap-2 overflow-x-auto border-b border-border">
        <button type="button" onClick={() => setTab("mine")} className={tc("mine")}>{t("myRequests")}</button>
        {isStaff && <button type="button" onClick={() => setTab("pending")} className={tc("pending")}>{t("pendingApproval")} ({m.pending.length})</button>}
        <button type="button" onClick={() => setTab("balances")} className={tc("balances")}>{t("leaveBalance")}</button>
        <button type="button" onClick={() => setTab("calendar")} className={tc("calendar")}>{t("teamCalendar")}</button>
      </div>
      {tab === "mine" && <LeaveRequestsTable rows={m.requests} onCancel={(id) => act(m.cancel(id))} />}
      {tab === "pending" && <PendingApprovalTab rows={m.pending} onApprove={(id) => act(m.approve(id))} onReject={setRejecting} />}
      {tab === "balances" && <LeaveBalancesTable rows={m.balances} showEmployee={isStaff} />}
      {tab === "calendar" && <TeamCalendar />}
      {reqOpen && <LeaveRequestModal types={m.types} balances={m.balances} onSubmit={m.requestLeave} onClose={() => setReqOpen(false)} />}
      {rejecting && <RejectLeaveModal onReject={(reason) => act(m.reject(rejecting, reason))} onClose={() => setRejecting(null)} />}
    </div>
  );
}
