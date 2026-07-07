import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import { useModuleAccess } from "@shared/hooks/useModuleAccess";
import { useEvaluations } from "@hr/application/useEvaluations.hook";
import { supabaseEvaluationRepository } from "@hr/infrastructure/supabase-evaluation.repository";
import { EvaluationForm } from "@hr/presentation/EvaluationForm";
import { EvaluationTable } from "@hr/presentation/EvaluationTable";
import { EvaluationDetail } from "@hr/presentation/EvaluationDetail";
import type { EvaluationDetail as ED } from "@hr/domain/evaluation.types";

export const Route = createFileRoute("/_authenticated/evaluations")({ component: EvaluationsPage });
type Emp = { id: string; full_name: string };

function EvaluationsPage() {
  const { t } = useI18n();
  const { can } = useModuleAccess();
  const m = useEvaluations(supabaseEvaluationRepository);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<ED | null>(null);
  useEffect(() => { void supabase.from("profiles").select("id, full_name").then(({ data }) => setEmps((data as Emp[] | null) ?? [])); }, []);
  if (!can("evaluations", "view")) return <Navigate to="/dashboard" />;
  const view = (id: string) => void m.detail(id).then((d) => { if (d) setViewing(d); });
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-xl font-bold text-primary md:text-3xl">{t("evaluations")}</h1>
          {can("evaluations", "create") && (
            <button type="button" onClick={() => setCreating((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-body font-bold">
              <Plus className="h-4 w-4" /> {t("newEvaluation")}</button>)}
        </div>
        <p className="text-xs text-muted-foreground">{t("evaluationsSubtitle")}</p>
      </div>
      {creating && <EvaluationForm employees={emps} criteria={m.criteria} onSuggest={m.suggest} onSubmit={m.save} onCancel={() => setCreating(false)} />}
      <EvaluationTable rows={m.list} onView={view} />
      {viewing && <EvaluationDetail ev={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
