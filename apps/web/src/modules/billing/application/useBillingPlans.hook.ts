import { useCallback, useEffect, useState } from "react";
import type { IBillingRepository, BillingPlan, BillingPlanInput, PlanStatus } from "@billing/domain/billing-plan.types";

export function useBillingPlans(repo: IBillingRepository) {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const load = useCallback(async () => { setPlans(await repo.listPlans()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const save = useCallback(async (d: BillingPlanInput) => { const r = await repo.savePlan(d); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: PlanStatus) => { const r = await repo.setPlanStatus(id, st); if (r.ok) await load(); return r; }, [repo, load]);
  const runCycle = useCallback(async () => { const n = await repo.runCycle(); await load(); return n; }, [repo, load]);
  return { plans, save, setStatus, runCycle };
}
