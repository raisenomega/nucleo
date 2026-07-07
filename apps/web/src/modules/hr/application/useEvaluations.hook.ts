import { useCallback, useEffect, useState } from "react";
import type { IEvaluationRepository, Criterion, Evaluation, SaveScore } from "@hr/domain/evaluation.types";

// DI del repo. Carga criterios + evaluaciones; guardar refresca. suggest/detail se exponen directo.
export function useEvaluations(repo: IEvaluationRepository) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [list, setList] = useState<Evaluation[]>([]);
  const load = useCallback(async () => {
    const [c, l] = await Promise.all([repo.getCriteria(), repo.list()]);
    setCriteria(c); setList(l);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (employeeId: string, period: string, scores: SaveScore[], notes: string) => {
    const r = await repo.save(employeeId, period, scores, notes); if (r.ok) await load(); return r;
  }, [repo, load]);
  return { criteria, list, save, suggest: repo.suggest, detail: repo.detail, refresh: load };
}
