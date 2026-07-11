import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useRoleGate } from "@shared/hooks/useRoleGate";
import { useEvaluations } from "@hr/application/useEvaluations.hook";
import { useFeedback } from "@hr/application/useFeedback.hook";
import { supabaseEvaluationRepository } from "@hr/infrastructure/supabase-evaluation.repository";
import { supabaseFeedbackRepository } from "@hr/infrastructure/supabase-feedback.repository";
import { EvaluationForm } from "@hr/presentation/EvaluationForm";
import { EvaluationTable } from "@hr/presentation/EvaluationTable";
import { EvaluationDetail } from "@hr/presentation/EvaluationDetail";
import { EvalPeriodBanner } from "@hr/presentation/EvalPeriodBanner";
import { FeedbackForm } from "@hr/presentation/FeedbackForm";
import { FeedbackTable } from "@hr/presentation/FeedbackTable";
import type { EvaluationDetail as ED } from "@hr/domain/evaluation.types";

export const Route = createFileRoute("/_authenticated/evaluations")({ component: EvaluationsPage });
type Emp = { id: string; full_name: string };

function EvaluationsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const { canEdit } = useRoleGate();
  const ev = useEvaluations(supabaseEvaluationRepository);
  const fb = useFeedback(supabaseFeedbackRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [tab, setTab] = useState<"evals" | "feedback">("evals");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<ED | null>(null);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);
  const names = useMemo(() => Object.fromEntries(emps.map((e) => [e.id, e.full_name])), [emps]);
  if (!can("evaluations", "view")) return <Navigate to="/dashboard" />;
  const canCoo = canEdit("coo");
  const view = (id: string) => void ev.detail(id).then((d) => { if (d) setViewing(d); });
  const tabCls = (x: string) => `px-3 py-2 text-sm font-bold ${tab === x ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`;
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-foreground md:text-3xl">{t("evaluations")}</h1>
          {can("evaluations", "create") && <button type="button" onClick={() => setCreating((v) => !v)}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
            <Plus className="h-4 w-4" /> {tab === "evals" ? t("newEvaluation") : t("newFeedback")}</button>}
        </div>
        <p className="text-xs text-muted-foreground">{t("evaluationsSubtitle")}</p>
      </div>
      <EvalPeriodBanner count={ev.list.length} />
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => { setTab("evals"); setCreating(false); }} className={tabCls("evals")}>{t("evaluations")}</button>
        <button type="button" onClick={() => { setTab("feedback"); setCreating(false); }} className={tabCls("feedback")}>{t("fbTab")}</button>
      </div>
      {tab === "evals" ? (
        <>{creating && <EvaluationForm employees={emps} criteria={ev.criteria} canFormal={canCoo} onSuggest={ev.suggest} onSubmit={ev.save} onCancel={() => setCreating(false)} />}
          <EvaluationTable rows={ev.list} onView={view} />
          {viewing && <EvaluationDetail ev={viewing} onClose={() => setViewing(null)} />}</>
      ) : (
        <>{creating && <FeedbackForm employees={emps} onSubmit={fb.save} onCancel={() => setCreating(false)} />}
          <FeedbackTable rows={fb.list} names={names} canAck={canCoo} onAck={(id) => void fb.acknowledge(id)} /></>
      )}
    </div>
  );
}
