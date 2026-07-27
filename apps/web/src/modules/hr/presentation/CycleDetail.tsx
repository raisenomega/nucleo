import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { ScreenModal } from "@shared/components/ScreenModal";
import { supabaseEvalCycleRepository } from "@hr/infrastructure/supabase-evalcycle.repository";
import { CompleteEvalModal } from "@hr/presentation/CompleteEvalModal";
import { Rollup360 } from "@hr/presentation/Rollup360";
import { EvalHistoryChart } from "@hr/presentation/EvalHistoryChart";
import type { Criterion } from "@hr/domain/evaluation.types";
import type { EvaluationCycle, CycleEval, Rollup360 as R, HistoryPoint } from "@hr/domain/evalcycle.types";

const PK: Record<string, TranslationKey> = { top_down: "evTopDown", peer: "evPeer", bottom_up: "evBottomUp", self: "evSelf" };

export function CycleDetail({ cycle, criteria, onClose }: { cycle: EvaluationCycle; criteria: readonly Criterion[]; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [evals, setEvals] = useState<CycleEval[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [sel, setSel] = useState("");
  const [rollup, setRollup] = useState<R | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const load = useCallback(() => { void supabaseEvalCycleRepository.getCycleEvals(cycle.id).then(setEvals); }, [cycle.id]);
  useEffect(load, [load]);
  const openEmp = (e: CycleEval) => { setSel(e.employeeName); void supabaseEvalCycleRepository.get360(e.employeeId, cycle.id).then(setRollup); void supabaseEvalCycleRepository.getHistory(e.employeeId).then(setHistory); };
  const complete = async (id: string, scores: { criterionId: string; score: number }[], notes: string) => {
    const r = await supabaseEvalCycleRepository.completeEval(id, scores, notes); if (r.ok) load(); else toast.error(r.error); return r;
  };
  return (
    <ScreenModal onClose={onClose}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="font-display text-lg font-bold text-foreground">{cycle.name}</h2>
        <button type="button" onClick={onClose} aria-label={t("cancel")}><X className="h-6 w-6" /></button>
      </div>
      <div className="space-y-4 p-4">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-2">{t("employee")}</th><th className="p-2">{t("evaluator")}</th><th className="p-2">{t("evalType")}</th><th className="p-2">{t("composite")}</th><th className="p-2"></th></tr></thead>
          <tbody>{evals.map((e) => (
            <tr key={e.id} className="border-b border-border">
              <td className="p-2 font-semibold">{e.employeeName}</td><td className="p-2 text-muted-foreground">{e.evaluatorName}</td>
              <td className="p-2">{t(PK[e.evalType] ?? "evTopDown")}</td><td className="p-2">{e.score ?? "—"}</td>
              <td className="p-2 text-right">{e.status === "pending"
                ? <button type="button" onClick={() => setCompleting(e.id)} className="text-xs font-bold text-primary">{t("markCompleted")}</button>
                : <button type="button" onClick={() => openEmp(e)} className="text-xs font-bold text-primary">360°</button>}</td></tr>))}</tbody>
        </table></div>
        {sel && <div className="space-y-2 rounded-xl border border-border p-3"><h3 className="font-bold text-foreground">{sel}</h3>{rollup && <Rollup360 rollup={rollup} />}<EvalHistoryChart history={history} /></div>}
      </div>
      {completing && <CompleteEvalModal evalId={completing} criteria={criteria} onComplete={complete} onClose={() => setCompleting(null)} />}
    </ScreenModal>
  );
}
