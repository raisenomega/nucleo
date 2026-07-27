import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { supabaseOnboardingRepository } from "@hr/infrastructure/supabase-onboarding.repository";
import { OnboardingTaskRow } from "@hr/presentation/OnboardingTaskRow";
import { TaskSignModal } from "@hr/presentation/TaskSignModal";
import { CATEGORIES, CAT_ICON, CAT_KEY } from "@hr/presentation/onboarding-ui";
import type { OnboardingStatus, OnboardingTask, OnbResult } from "@hr/domain/onboarding.types";

export function OnboardingDetail({ employeeId, employeeName, isStaff, tenantId, onChanged }: {
  employeeId: string; employeeName: string; isStaff: boolean; tenantId: string; onChanged?: () => void;
}) {
  const { t } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<OnboardingStatus | null | undefined>(undefined);
  const [signing, setSigning] = useState<OnboardingTask | null>(null);
  const load = useCallback(() => { void supabaseOnboardingRepository.getStatus(employeeId).then(setStatus); }, [employeeId]);
  useEffect(load, [load]);
  const act = async (p: Promise<OnbResult>) => { const r = await p; if (!r.ok) toast.error(r.error); load(); onChanged?.(); };
  const onComplete = (id: string, sig: string | null, doc: string | null) => void act(supabaseOnboardingRepository.completeTask(id, sig, doc));
  const onSkip = (id: string) => void act(supabaseOnboardingRepository.skipTask(id));
  if (status === undefined) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (status === null) return <p className="text-sm text-muted-foreground">{t("noOnboarding")}</p>;
  const { checklist, tasks } = status;
  const pct = checklist.totalTasks ? Math.round(100 * checklist.completedTasks / checklist.totalTasks) : 0;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{(employeeName || checklist.employeeName)}{checklist.positionTitle ? ` · ${checklist.positionTitle}` : ""}</h2>
        <div className="mt-2 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div><span className="text-sm font-bold">{checklist.completedTasks}/{checklist.totalTasks}</span></div>
        {checklist.status === "completed" && <p className="mt-1 text-sm font-bold text-green-600">{t("onboardingCompleted")} ✅</p>}
      </div>
      {CATEGORIES.map((cat) => {
        const items = tasks.filter((x) => x.category === cat);
        if (items.length === 0) return null;
        const Icon = CAT_ICON[cat];
        return (
          <section key={cat} className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><Icon className="h-4 w-4" /> {t(CAT_KEY[cat])}</h3>
            {items.map((task) => <OnboardingTaskRow key={task.id} task={task} isStaff={isStaff} tenantId={tenantId} employeeId={employeeId} onComplete={onComplete} onSkip={onSkip} onSign={setSigning} />)}
          </section>);
      })}
      {signing && <TaskSignModal title={signing.title} onSign={(sig) => onComplete(signing.id, sig, null)} onClose={() => setSigning(null)} />}
    </div>
  );
}
