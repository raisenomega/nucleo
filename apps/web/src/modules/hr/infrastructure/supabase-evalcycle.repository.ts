import { supabase } from "@shared/lib/supabase";
import type {
  IEvalCycleRepository, EvaluationCycle, CycleEval, Rollup360, HistoryPoint, CycleFormData, CycleResult, Perspective,
} from "@hr/domain/evalcycle.types";

const ok = (e: { message: string } | null): CycleResult => (e ? { ok: false, error: e.message } : { ok: true });
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const CSEL = "id,name,cycle_type,period_start,period_end,evaluation_deadline,perspectives,status,total_evaluations,completed_evaluations";

const toCycle = (r: Record<string, unknown>): EvaluationCycle => ({
  id: r.id as string, name: r.name as string, cycleType: r.cycle_type as string, periodStart: r.period_start as string,
  periodEnd: r.period_end as string, evaluationDeadline: r.evaluation_deadline as string, perspectives: arr(r.perspectives),
  status: r.status as EvaluationCycle["status"], totalEvaluations: Number(r.total_evaluations ?? 0), completedEvaluations: Number(r.completed_evaluations ?? 0),
});

export const supabaseEvalCycleRepository: IEvalCycleRepository = {
  async listCycles() {
    const { data } = await supabase.from("evaluation_cycles").select(CSEL).order("created_at", { ascending: false });
    return ((data as Record<string, unknown>[] | null) ?? []).map(toCycle);
  },
  async createCycle(d: CycleFormData) {
    return ok((await supabase.rpc("create_evaluation_cycle", { p_data: { name: d.name, cycle_type: d.cycleType,
      period_start: d.periodStart, period_end: d.periodEnd, evaluation_start: d.evaluationStart,
      evaluation_deadline: d.evaluationDeadline, perspectives: d.perspectives } })).error);
  },
  async activateCycle(id) { return ok((await supabase.rpc("activate_evaluation_cycle", { p_cycle_id: id })).error); },
  async getCycleEvals(cycleId): Promise<CycleEval[]> {
    const { data } = await supabase.rpc("get_cycle_evaluations", { p_cycle_id: cycleId });
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({ id: r.id as string, employeeId: r.employee_id as string,
      employeeName: (r.employee_name as string) ?? "—", evaluatorName: (r.evaluator_name as string) ?? "—",
      evalType: r.eval_type as string, status: r.status as string, score: r.score != null ? Number(r.score) : null }));
  },
  async completeEval(evalId, scores, notes) {
    return ok((await supabase.rpc("complete_cycle_evaluation", { p_eval_id: evalId,
      p_scores: scores.map((s) => ({ criterion_id: s.criterionId, score: s.score })), p_notes: notes || null })).error);
  },
  async get360(employeeId, cycleId): Promise<Rollup360 | null> {
    const { data } = await supabase.rpc("get_360_rollup", { p_employee_id: employeeId, p_cycle_id: cycleId });
    const d = data as Record<string, unknown> | null;
    if (!d) return null;
    return { perspectives: (d.perspectives as Record<string, Perspective>) ?? {}, consolidatedScore: d.consolidated_score != null ? Number(d.consolidated_score) : null,
      byCriteria: ((d.by_criteria as { name: string; avg: number }[]) ?? []).map((c) => ({ name: c.name, avg: Number(c.avg) })) };
  },
  async getHistory(employeeId): Promise<HistoryPoint[]> {
    const { data } = await supabase.rpc("get_employee_evaluation_history", { p_employee_id: employeeId });
    return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({ period: r.period as string, score: Number(r.score),
      evalType: r.eval_type as string, cycle: (r.cycle as string) ?? null }));
  },
};
