import { useState } from "react";
import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useLeave } from "@hr/application/useLeave.hook";
import { supabaseLeaveRepository } from "@hr/infrastructure/supabase-leave.repository";
import { LeaveBalancesTable } from "@hr/presentation/LeaveBalancesTable";
import { LeaveRequestsTable } from "@hr/presentation/LeaveRequestsTable";
import { LeaveRequestModal } from "@hr/presentation/LeaveRequestModal";

// Vacaciones del portal: balances + mis solicitudes (cancelar pendientes) + solicitar. Sin "pendientes de
// aprobar" ni calendario de equipo (eso es del staff / privacidad). isStaff=false filtra a auth.uid().
export function MyLeave({ userId }: { userId: string }) {
  const { t } = useI18n();
  const { types, balances, requests, requestLeave, cancel } = useLeave(supabaseLeaveRepository, userId, false);
  const [req, setReq] = useState(false);
  const h3 = "font-body text-sm font-bold text-foreground";
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={() => setReq(true)} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
          <Plus className="h-4 w-4" /> {t("requestLeave")}</button>
      </div>
      <section className="space-y-2"><h3 className={h3}>{t("leaveBalance")}</h3><LeaveBalancesTable rows={balances} showEmployee={false} /></section>
      <section className="space-y-2"><h3 className={h3}>{t("myRequests")}</h3><LeaveRequestsTable rows={requests} onCancel={(id) => void cancel(id)} /></section>
      {req && <LeaveRequestModal types={types} balances={balances} onSubmit={requestLeave} onClose={() => setReq(false)} />}
    </div>
  );
}
