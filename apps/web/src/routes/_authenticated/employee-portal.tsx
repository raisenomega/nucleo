import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { useSession } from "@shared/providers/SessionProvider";
import { usePortal } from "@hr/application/usePortal.hook";
import { supabasePortalRepository } from "@hr/infrastructure/supabase-portal.repository";
import { PortalSummary } from "@hr/presentation/PortalSummary";
import { MyProfile } from "@hr/presentation/MyProfile";
import { MyPayroll } from "@hr/presentation/MyPayroll";
import { MyEvaluations } from "@hr/presentation/MyEvaluations";
import { MyLeave } from "@hr/presentation/MyLeave";
import { MyTraining } from "@hr/presentation/MyTraining";
import { MyAttendance } from "@hr/presentation/MyAttendance";
import { MyOnboarding } from "@hr/presentation/MyOnboarding";

export const Route = createFileRoute("/_authenticated/employee-portal")({ component: EmployeePortal });
const TABS: { k: string; label: TranslationKey }[] = [
  { k: "overview", label: "overview" }, { k: "profile", label: "myProfile" }, { k: "payroll", label: "myPayroll" },
  { k: "evaluations", label: "myEvaluations" }, { k: "leave", label: "myLeave" }, { k: "training", label: "myTraining" }, { k: "attendance", label: "myAttendance" },
];

function EmployeePortal() {
  const { t } = useI18n();
  const { session } = useSession();
  const m = usePortal(supabasePortalRepository);
  const [tab, setTab] = useState("overview");
  const userId = session?.userId ?? ""; const tenantId = session?.tenantId ?? "";
  const tabs = m.summary?.pendingOnboarding ? [...TABS, { k: "onboarding", label: "myOnboarding" as TranslationKey }] : TABS;
  const tc = (x: string) => `whitespace-nowrap px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("myPortal")}{m.details ? ` — ${m.details.fullName}` : ""}</h1>
        {m.details && <p className="text-xs text-muted-foreground">{[m.details.position, m.details.department].filter(Boolean).join(" · ")}</p>}
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((x) => <button key={x.k} type="button" onClick={() => setTab(x.k)} className={tc(x.k)}>{t(x.label)}</button>)}
      </div>
      {tab === "overview" && <PortalSummary name={m.details?.fullName ?? ""} userId={userId} summary={m.summary} onGo={setTab} />}
      {tab === "profile" && m.details && <MyProfile details={m.details} onSave={m.updateDetails} />}
      {tab === "payroll" && <MyPayroll employeeName={m.details?.fullName ?? ""} />}
      {tab === "evaluations" && <MyEvaluations userId={userId} />}
      {tab === "leave" && <MyLeave userId={userId} />}
      {tab === "training" && <MyTraining />}
      {tab === "attendance" && <MyAttendance userId={userId} />}
      {tab === "onboarding" && <MyOnboarding userId={userId} tenantId={tenantId} />}
    </div>
  );
}
