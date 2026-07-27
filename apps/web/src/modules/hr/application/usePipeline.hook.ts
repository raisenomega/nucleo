import { useCallback, useEffect, useState } from "react";
import type { IRecruitmentRepository, Applicant, ApplicantStage } from "@hr/domain/recruitment.types";

// Pipeline de UNA vacante: candidatos agrupados por stage + acciones (avanzar/rechazar/convertir).
export function usePipeline(repo: IRecruitmentRepository, openingId: string) {
  const [byStage, setByStage] = useState<Record<string, Applicant[]>>({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setByStage(await repo.pipeline(openingId)); setLoading(false);
  }, [repo, openingId]);
  useEffect(() => { void load(); }, [load]);
  const advance = useCallback(async (id: string, to: ApplicantStage) => { const r = await repo.advance(id, to); if (r.ok) await load(); return r; }, [repo, load]);
  const reject = useCallback(async (id: string, reason: string) => { const r = await repo.reject(id, reason); if (r.ok) await load(); return r; }, [repo, load]);
  const convert = useCallback(async (id: string) => { const r = await repo.convert(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { byStage, loading, refresh: load, advance, reject, convert };
}
