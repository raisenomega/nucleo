import { useState } from "react";
import { Settings } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { ClockWidget } from "@hr/presentation/ClockWidget";
import { TeamTodayTable } from "@hr/presentation/TeamTodayTable";
import { AttendanceHistory } from "@hr/presentation/AttendanceHistory";
import { AttendanceConfigModal } from "@hr/presentation/AttendanceConfigModal";

export function AttendancePage() {
  const { t } = useI18n();
  const { session } = useSession();
  const { canEdit } = useRoleGate();
  const userId = session?.userId ?? "";
  const isStaff = canEdit("coo");
  const [tab, setTab] = useState<"today" | "history">("today");
  const [cfg, setCfg] = useState(false);
  const tc = (x: string) => `px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("attendance")}</h1>
        {isStaff && <button type="button" onClick={() => setCfg(true)} className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-bold"><Settings className="h-4 w-4" /> {t("attendanceConfig")}</button>}
      </div>
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab("today")} className={tc("today")}>{t("today")}</button>
        <button type="button" onClick={() => setTab("history")} className={tc("history")}>{t("history")}</button>
      </div>
      {tab === "today"
        ? <div className="space-y-6"><ClockWidget userId={userId} />{isStaff && <TeamTodayTable />}</div>
        : <AttendanceHistory userId={userId} isStaff={isStaff} />}
      {cfg && session?.tenantId && <AttendanceConfigModal tenantId={session.tenantId} onClose={() => setCfg(false)} />}
    </div>
  );
}
