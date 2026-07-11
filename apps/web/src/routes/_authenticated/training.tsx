import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useTraining } from "@hr/application/useTraining.hook";
import { supabaseTrainingRepository } from "@hr/infrastructure/supabase-training.repository";
import { CourseForm } from "@hr/presentation/CourseForm";
import { CourseTable } from "@hr/presentation/CourseTable";
import { AssignForm } from "@hr/presentation/AssignForm";
import { EnrollmentTable } from "@hr/presentation/EnrollmentTable";

export const Route = createFileRoute("/_authenticated/training")({ component: TrainingPage });
type Emp = { id: string; full_name: string };

function TrainingPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useTraining(supabaseTrainingRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [tab, setTab] = useState<"courses" | "assign">("courses");
  const [creating, setCreating] = useState(false);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);
  if (!can("training", "view")) return <Navigate to="/dashboard" />;
  const canEdit = can("training", "edit");
  const assigned = m.summary.reduce((s, r) => s + r.assigned, 0);
  const pct = assigned > 0 ? Math.round(100 * m.summary.reduce((s, r) => s + r.completed, 0) / assigned) : 0;
  const complete = (id: string) => { const s = window.prompt(`${t("markComplete")} — score 0-100?`); void m.setStatus(id, "completed", s ? Number(s) : null); };
  const tabCls = (x: string) => `px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("training")}</h1>
          {can("training", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
            <Plus className="h-4 w-4" /> {tab === "courses" ? t("newCourse") : t("assignCourse")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("trainingSubtitle")}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t("completion")}</span>
        <p className="text-2xl font-bold text-foreground">{pct}%</p></div>
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => { setTab("courses"); setCreating(false); }} className={tabCls("courses")}>{t("courses")}</button>
        <button type="button" onClick={() => { setTab("assign"); setCreating(false); }} className={tabCls("assign")}>{t("assignments")}</button>
      </div>
      {tab === "courses" ? (
        <>{creating && <CourseForm onSubmit={m.saveCourse} onCancel={() => setCreating(false)} />}
          <CourseTable rows={m.courses} onDelete={canEdit ? (id) => { if (window.confirm(`${t("delete")}?`)) void m.removeCourse(id); } : undefined} /></>
      ) : (
        <>{creating && <AssignForm employees={emps} courses={m.courses} onSubmit={m.assign} onCancel={() => setCreating(false)} />}
          <EnrollmentTable rows={m.enrollments} onComplete={canEdit ? complete : undefined}
            onDelete={canEdit ? (id) => { if (window.confirm(`${t("delete")}?`)) void m.removeEnrollment(id); } : undefined} /></>
      )}
    </div>
  );
}
