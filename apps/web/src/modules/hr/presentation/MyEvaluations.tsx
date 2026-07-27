import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useI18n, type TranslationKey } from "@shared/i18n";
import { supabaseEvaluationRepository } from "@hr/infrastructure/supabase-evaluation.repository";
import { supabaseEvalCycleRepository } from "@hr/infrastructure/supabase-evalcycle.repository";
import { supabasePortalRepository } from "@hr/infrastructure/supabase-portal.repository";
import { EvalHistoryChart } from "@hr/presentation/EvalHistoryChart";
import { EvaluationDetail } from "@hr/presentation/EvaluationDetail";
import { CompleteEvalModal } from "@hr/presentation/CompleteEvalModal";
import type { Evaluation, EvaluationDetail as ED, Criterion } from "@hr/domain/evaluation.types";
import type { HistoryPoint } from "@hr/domain/evalcycle.types";
import type { PendingEval } from "@hr/domain/portal.types";

const EVK: Record<string, TranslationKey> = { top_down: "evTopDown", self: "evSelf", bottom_up: "evBottomUp", peer: "evPeer" };
const evLabel = (x: string): TranslationKey => EVK[x] ?? "evTopDown";

export function MyEvaluations({ userId }: { userId: string }) {
  const { t } = useI18n();
  const [evals, setEvals] = useState<Evaluation[]>([]); const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [pending, setPending] = useState<PendingEval[]>([]); const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [detail, setDetail] = useState<ED | null>(null); const [doing, setDoing] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [e, h, p, c] = await Promise.all([supabaseEvaluationRepository.list(), supabaseEvalCycleRepository.getHistory(userId),
      supabasePortalRepository.pendingEvals(), supabaseEvaluationRepository.getCriteria()]);
    setEvals(e); setHistory(h as HistoryPoint[]); setPending(p); setCriteria(c);
  }, [userId]);
  useEffect(() => { void load(); }, [load]);
  const complete = async (id: string, scores: { criterionId: string; score: number }[], notes: string) => {
    const r = await supabaseEvalCycleRepository.completeEval(id, scores, notes); if (r.ok) { setDoing(null); await load(); } return r; };
  return (
    <div className="space-y-6">
      {pending.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <span className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4" /> {t(evLabel(p.evalType))} · {p.employeeName}</span>
          <button type="button" onClick={() => setDoing(p.id)} className="rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{t("completeEvaluation")}</button>
        </div>))}
      {history.length > 0 && <EvalHistoryChart history={history} />}
      {evals.length === 0 ? <p className="text-sm text-muted-foreground">{t("noRecords")}</p> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
          <th className="p-2">{t("period")}</th><th className="p-2">{t("evalType")}</th><th className="p-2">{t("composite")}</th><th className="p-2"></th></tr></thead>
          <tbody>{evals.map((e) => (
            <tr key={e.id} className="border-b border-border"><td className="p-2 font-semibold">{e.period}</td><td className="p-2">{t(evLabel(e.evalType))}</td>
              <td className="p-2 font-bold">{e.compositeScore.toFixed(1)}/10</td>
              <td className="p-2 text-right"><button type="button" onClick={() => void supabaseEvaluationRepository.detail(e.id).then(setDetail)} className="text-xs font-bold text-primary">{t("view")}</button></td></tr>))}</tbody>
        </table>)}
      {detail && <EvaluationDetail ev={detail} onClose={() => setDetail(null)} />}
      {doing && <CompleteEvalModal evalId={doing} criteria={criteria} onComplete={complete} onClose={() => setDoing(null)} />}
    </div>
  );
}
