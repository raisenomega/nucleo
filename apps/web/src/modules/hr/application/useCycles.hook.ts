import { useCallback, useEffect, useState } from "react";
import type { IEvalCycleRepository, EvaluationCycle, CycleFormData } from "@hr/domain/evalcycle.types";

// DI del repo. Ciclos de evaluación; crear/activar refresca.
export function useCycles(repo: IEvalCycleRepository) {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const load = useCallback(async () => { setCycles(await repo.listCycles()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const create = useCallback(async (d: CycleFormData) => { const r = await repo.createCycle(d); if (r.ok) await load(); return r; }, [repo, load]);
  const activate = useCallback(async (id: string) => { const r = await repo.activateCycle(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { cycles, refresh: load, create, activate };
}
