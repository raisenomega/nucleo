// BC hr — evaluaciones de desempeño. Puro.
export type EvalResult = { ok: true } | { ok: false; error: string };
export type Classification = "excelente" | "bueno" | "necesita_mejora" | "insuficiente";
export type EvalType = "top_down" | "peer" | "bottom_up" | "self";

export interface Criterion { readonly id: string; readonly label: string; readonly weight: number; readonly sort: number; }
export interface EvalScore { readonly criterionId: string; readonly label: string; readonly score: number; }
export interface Evaluation {
  readonly id: string; readonly employeeId: string; readonly employeeName: string; readonly period: string;
  readonly compositeScore: number; readonly classification: Classification | null;
  readonly inProbation: boolean; readonly requiresLegalValidation: boolean;
  readonly evalType: EvalType; readonly isAnonymous: boolean; readonly evaluatorId: string;
  readonly status: string; readonly notes: string | null; readonly createdAt: string;
}
export interface EvaluationDetail extends Evaluation { readonly scores: readonly EvalScore[]; }
export interface Suggestion {
  readonly completed: number; readonly notAttended: number; readonly collected: number;
  readonly completionRate: number; readonly suggestedOperational: number;
}
export interface SaveScore { criterionId: string; score: number; }

// Clasificación por composite (umbrales aprobados). Pura.
export function classify(score: number): Classification {
  return score >= 9 ? "excelente" : score >= 7.5 ? "bueno" : score >= 6 ? "necesita_mejora" : "insuficiente";
}

export interface IEvaluationRepository {
  getCriteria(): Promise<Criterion[]>;
  list(): Promise<Evaluation[]>;
  detail(id: string): Promise<EvaluationDetail | null>;
  save(employeeId: string, period: string, scores: SaveScore[], notes: string, evalType: EvalType, isAnonymous: boolean): Promise<EvalResult>;
  suggest(employeeId: string, from: string, to: string): Promise<Suggestion>;
}
