import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Upload, PenLine, ArrowRight, X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { supabaseOnboardingRepository } from "@hr/infrastructure/supabase-onboarding.repository";
import { isOverdue } from "@hr/presentation/onboarding-ui";
import type { OnboardingTask } from "@hr/domain/onboarding.types";

export function OnboardingTaskRow({ task, isStaff, tenantId, employeeId, onComplete, onSkip, onSign }: {
  task: OnboardingTask; isStaff: boolean; tenantId: string; employeeId: string;
  onComplete: (id: string, sig: string | null, doc: string | null) => void; onSkip: (id: string) => void; onSign: (t: OnboardingTask) => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const done = task.status === "completed", skipped = task.status === "skipped";
  const allowed = task.assignedTo === "employee" || isStaff;
  const overdue = isOverdue(task.dueDate, task.status);
  async function pickDoc(file: File) { setBusy(true); const p = await supabaseOnboardingRepository.uploadTaskDoc(tenantId, employeeId, task.id, file); if (p) onComplete(task.id, null, p); setBusy(false); }
  async function viewDoc() { if (!task.documentUrl) return; const u = await supabaseOnboardingRepository.signDoc(task.documentUrl); if (u) window.open(u, "_blank"); }
  const btn = "flex items-center gap-1 rounded bg-secondary px-2 py-1 text-xs font-bold";
  const action = () => {
    if (done || skipped) return null;
    if (!allowed) return <span className="text-xs text-muted-foreground">{t(task.assignedTo === "admin" ? "assignedToAdmin" : "assignedToEmployee")}</span>;
    if (task.requiresSignature) return <button type="button" onClick={() => onSign(task)} className={btn}><PenLine className="h-3 w-3" /> {t("signContract")}</button>;
    if (task.requiresDocument) return <label className={`${btn} cursor-pointer`}><Upload className="h-3 w-3" /> {busy ? "…" : t("uploadDocument")}<input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickDoc(f); }} /></label>;
    if (task.linkedTrainingId) return <span className="flex gap-2"><Link to="/training" className="flex items-center gap-1 text-xs font-bold text-primary">{t("training")} <ArrowRight className="h-3 w-3" /></Link><button type="button" onClick={() => onComplete(task.id, null, null)} className={btn}>{t("markCompleted")}</button></span>;
    return <button type="button" onClick={() => onComplete(task.id, null, null)} className={btn}>{t("markCompleted")}</button>;
  };
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border p-2 text-sm">
      <div className="min-w-0">
        <p className="flex items-center gap-1 font-semibold text-foreground">{done && <Check className="h-4 w-4 shrink-0 text-green-600" />}{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
        {done ? <p className="text-xs text-muted-foreground">{task.completedAt?.slice(0, 10)}{task.documentUrl && <button type="button" onClick={() => void viewDoc()} className="ml-2 text-primary hover:underline">{t("viewDetail")}</button>}</p>
          : skipped ? <p className="text-xs text-muted-foreground">{t("taskSkipped")}</p>
          : task.dueDate && <p className={`text-xs ${overdue ? "font-bold text-destructive" : "text-muted-foreground"}`}>{t("dueDate")}: {task.dueDate.slice(5)}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {action()}
        {isStaff && !done && !skipped && <button type="button" onClick={() => onSkip(task.id)} aria-label={t("skipTask")} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}
