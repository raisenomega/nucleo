import { supabase } from "@shared/lib/supabase";
import type {
  IEvaluationRepository, Criterion, Evaluation, EvaluationDetail, Suggestion, SaveScore, EvalResult, Classification,
} from "@hr/domain/evaluation.types";

// list/detail van por RPC SECURITY DEFINER (get_my_evaluations/get_evaluation_detail): enmascaran
// evaluator_id cuando la eval es anónima y el viewer no es COO+ ni el evaluador (fix de privacidad).
interface Row {
  id: string; employee_id: string; period: string; composite_score: number | string | null;
  classification: string | null; in_probation: boolean; requires_legal_validation: boolean;
  eval_type: string; is_anonymous: boolean; evaluator_id: string | null;
  status: string; notes: string | null; created_at: string; employee_name: string | null;
}
const toEval = (r: Row): Evaluation => ({
  id: r.id, employeeId: r.employee_id, employeeName: r.employee_name ?? "—", period: r.period,
  compositeScore: Number(r.composite_score ?? 0), classification: (r.classification as Classification | null),
  inProbation: r.in_probation, requiresLegalValidation: r.requires_legal_validation,
  evalType: r.eval_type as Evaluation["evalType"], isAnonymous: r.is_anonymous, evaluatorId: r.evaluator_id,
  status: r.status, notes: r.notes, createdAt: r.created_at,
});

export const supabaseEvaluationRepository: IEvaluationRepository = {
  async getCriteria(): Promise<Criterion[]> {
    const { data } = await supabase.from("evaluation_criteria").select("id,label,weight,sort").eq("active", true).order("sort");
    return ((data as { id: string; label: string; weight: number | string; sort: number }[] | null) ?? [])
      .map((c) => ({ id: c.id, label: c.label, weight: Number(c.weight), sort: c.sort }));
  },
  async list(): Promise<Evaluation[]> {
    const { data } = await supabase.rpc("get_my_evaluations");
    return ((data as Row[] | null) ?? []).map(toEval);
  },
  async detail(id): Promise<EvaluationDetail | null> {
    const { data } = await supabase.rpc("get_evaluation_detail", { p_id: id });
    const r = data as (Row & { scores: { criterion_id: string; label: string; score: number | string }[] }) | null;
    if (!r) return null;
    const scores = (r.scores ?? []).map((s) => ({ criterionId: s.criterion_id, label: s.label, score: Number(s.score) }));
    return { ...toEval(r), scores };
  },
  async save(employeeId, period, scores: SaveScore[], notes, evalType, isAnonymous): Promise<EvalResult> {
    const { error } = await supabase.rpc("save_evaluation", {
      p_employee_id: employeeId, p_period: period,
      p_scores: scores.map((s) => ({ criterion_id: s.criterionId, score: s.score })), p_notes: notes || null,
      p_eval_type: evalType, p_is_anonymous: isAnonymous,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
  async suggest(employeeId, from, to): Promise<Suggestion> {
    const { data } = await supabase.rpc("suggest_evaluation_scores", { p_employee_id: employeeId, p_from: from, p_to: to });
    const d = (data as { completed: number; not_attended: number; collected: number | string; completion_rate: number | string; suggested_operational: number | string } | null);
    return { completed: d?.completed ?? 0, notAttended: d?.not_attended ?? 0, collected: Number(d?.collected ?? 0),
      completionRate: Number(d?.completion_rate ?? 0), suggestedOperational: Number(d?.suggested_operational ?? 0) };
  },
};
