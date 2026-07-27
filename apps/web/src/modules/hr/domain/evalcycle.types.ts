// BC hr — ciclos de evaluación + 360° + historial. Puro.
export type CycleStatus = "draft" | "active" | "closed" | "cancelled";
export type CycleResult = { ok: true } | { ok: false; error: string };

export interface EvaluationCycle {
  readonly id: string; readonly name: string; readonly cycleType: string;
  readonly periodStart: string; readonly periodEnd: string; readonly evaluationDeadline: string;
  readonly perspectives: readonly string[]; readonly status: CycleStatus;
  readonly totalEvaluations: number; readonly completedEvaluations: number;
}
export interface CycleEval {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly evaluatorName: string; readonly evalType: string; readonly status: string; readonly score: number | null;
}
export interface Perspective { readonly score: number; readonly count: number }
export interface Rollup360 {
  readonly perspectives: Readonly<Record<string, Perspective>>; readonly consolidatedScore: number | null;
  readonly byCriteria: readonly { readonly name: string; readonly avg: number }[];
}
export interface HistoryPoint { readonly period: string; readonly score: number; readonly evalType: string; readonly cycle: string | null }
export interface CycleFormData {
  name: string; cycleType: string; periodStart: string; periodEnd: string;
  evaluationStart: string; evaluationDeadline: string; perspectives: string[];
}

export interface IEvalCycleRepository {
  listCycles(): Promise<EvaluationCycle[]>;
  createCycle(d: CycleFormData): Promise<CycleResult>;
  activateCycle(id: string): Promise<CycleResult>;
  getCycleEvals(cycleId: string): Promise<CycleEval[]>;
  completeEval(evalId: string, scores: { criterionId: string; score: number }[], notes: string): Promise<CycleResult>;
  get360(employeeId: string, cycleId: string): Promise<Rollup360 | null>;
  getHistory(employeeId: string): Promise<HistoryPoint[]>;
}
