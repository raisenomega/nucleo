import { supabase } from "@shared/lib/supabase";
import type {
  IEvaluationRepository, Criterion, Evaluation, EvaluationDetail, Suggestion, SaveScore, EvalResult, Classification,
} from "@hr/domain/evaluation.types";

interface Row {
  id: string; employee_id: string; period: string; composite_score: number | string | null;
  classification: string | null; in_probation: boolean; requires_legal_validation: boolean;
  status: string; notes: string | null; created_at: string; profiles: { full_name: string } | null;
}
const toEval = (r: Row): Evaluation => ({
  id: r.id, employeeId: r.employee_id, employeeName: r.profiles?.full_name ?? "—", period: r.period,
  compositeScore: Number(r.composite_score ?? 0), classification: (r.classification as Classification | null),
  inProbation: r.in_probation, requiresLegalValidation: r.requires_legal_validation,
  status: r.status, notes: r.notes, createdAt: r.created_at,
});
const SEL = "id,employee_id,period,composite_score,classification,in_probation,requires_legal_validation,status,notes,created_at,profiles:employee_id(full_name)";

export const supabaseEvaluationRepository: IEvaluationRepository = {
  async getCriteria(): Promise<Criterion[]> {
    const { data } = await supabase.from("evaluation_criteria").select("id,label,weight,sort").eq("active", true).order("sort");
    return ((data as { id: string; label: string; weight: number | string; sort: number }[] | null) ?? [])
      .map((c) => ({ id: c.id, label: c.label, weight: Number(c.weight), sort: c.sort }));
  },
  async list(): Promise<Evaluation[]> {
    const { data } = await supabase.from("evaluations").select(SEL).order("created_at", { ascending: false });
    return ((data as unknown as Row[] | null) ?? []).map(toEval);
  },
  async detail(id): Promise<EvaluationDetail | null> {
    const { data } = await supabase.from("evaluations").select(SEL).eq("id", id).single();
    if (!data) return null;
    const { data: sc } = await supabase.from("evaluation_scores").select("criterion_id,score,evaluation_criteria:criterion_id(label)").eq("evaluation_id", id);
    const scores = ((sc as unknown as { criterion_id: string; score: number | string; evaluation_criteria: { label: string } | null }[] | null) ?? [])
      .map((s) => ({ criterionId: s.criterion_id, label: s.evaluation_criteria?.label ?? "—", score: Number(s.score) }));
    return { ...toEval(data as unknown as Row), scores };
  },
  async save(employeeId, period, scores: SaveScore[], notes): Promise<EvalResult> {
    const { error } = await supabase.rpc("save_evaluation", {
      p_employee_id: employeeId, p_period: period,
      p_scores: scores.map((s) => ({ criterion_id: s.criterionId, score: s.score })), p_notes: notes || null,
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
