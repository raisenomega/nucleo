import { AlertTriangle, DollarSign, Palmtree, GraduationCap } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { ClockWidget } from "@hr/presentation/ClockWidget";
import type { PortalSummary as PS } from "@hr/domain/portal.types";

// Dashboard del portal: saludo + clock + pendientes + KPIs. onGo salta al tab correspondiente.
export function PortalSummary({ name, userId, summary, onGo }: {
  name: string; userId: string; summary: PS | null; onGo: (tab: string) => void;
}) {
  const { t } = useI18n();
  const alerts: { n: number; label: string; tab: string }[] = summary ? [
    { n: summary.pendingEvaluations, label: t("evaluationPending"), tab: "evaluations" },
    { n: summary.pendingOnboarding, label: t("pendingItems"), tab: "onboarding" },
    { n: summary.expiringCerts, label: t("certExpiring"), tab: "training" },
  ].filter((a) => a.n > 0) : [];
  const kpi = (Icon: typeof DollarSign, label: string, val: string, tab: string) => (
    <button type="button" onClick={() => onGo(tab)} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary">
      <Icon className="h-6 w-6 text-primary" /><span><span className="block text-xs font-bold text-muted-foreground">{label}</span><span className="text-lg font-bold text-foreground">{val}</span></span></button>);
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-foreground">{t("greeting")}, {name.split(" ")[0]} 👋</h2>
      <ClockWidget userId={userId} />
      <section className="space-y-2">
        <h3 className="font-body text-sm font-bold text-foreground">{t("pendingItems")}</h3>
        {alerts.length === 0 ? <p className="text-sm text-muted-foreground">{t("noPending")}</p> : alerts.map((a) => (
          <button key={a.tab} type="button" onClick={() => onGo(a.tab)} className="flex w-full items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-left text-sm font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" /> {a.n} {a.label}</button>))}
      </section>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {kpi(DollarSign, t("lastPayroll"), summary?.lastPayroll ? `$${summary.lastPayroll.net.toFixed(2)}` : "—", "payroll")}
        {kpi(Palmtree, t("availableDays"), `${summary?.availableLeave ?? 0}`, "leave")}
        {kpi(GraduationCap, t("completedCourses"), `${summary?.coursesCompleted ?? 0}/${summary?.coursesTotal ?? 0}`, "training")}
      </div>
    </div>
  );
}
