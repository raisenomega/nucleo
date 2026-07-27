import { Plus } from "lucide-react";
import { useI18n } from "@shared/i18n";
import type { OnboardingChecklist } from "@hr/domain/onboarding.types";

export function OnboardingList({ rows, onOpen, onStart }: {
  rows: readonly OnboardingChecklist[]; onOpen: (c: OnboardingChecklist) => void; onStart: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={onStart} className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> {t("startOnboarding")}</button>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("employee")}</th><th className="p-2">{t("position")}</th><th className="p-2">{t("progress")}</th>
            <th className="p-2">{t("date")}</th><th className="p-2">{t("status")}</th></tr></thead>
          <tbody>{rows.map((c) => {
            const pct = c.totalTasks ? Math.round(100 * c.completedTasks / c.totalTasks) : 0;
            return (
              <tr key={c.id} onClick={() => onOpen(c)} className="cursor-pointer border-b border-border hover:bg-secondary">
                <td className="p-2 font-semibold">{c.employeeName}</td><td className="p-2 text-muted-foreground">{c.positionTitle ?? "—"}</td>
                <td className="p-2"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="text-xs">{c.completedTasks}/{c.totalTasks}</span></div></td>
                <td className="p-2">{c.startedAt.slice(0, 10)}</td>
                <td className="p-2">{c.status === "completed" ? <span className="font-bold text-green-600">{t("onboardingCompleted")}</span> : <span className="text-amber-600">{t("taskPending")}</span>}</td></tr>);
          })}</tbody>
        </table></div>)}
    </div>
  );
}
