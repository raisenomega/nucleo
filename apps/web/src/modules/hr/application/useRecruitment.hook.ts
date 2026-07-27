import { useCallback, useEffect, useState } from "react";
import type {
  IRecruitmentRepository, JobPosition, JobOpening, PositionFormData, OpeningFormData,
} from "@hr/domain/recruitment.types";

// DI del repo. Carga puestos + vacantes; cada mutación refresca. El pipeline vive en usePipeline.
export function useRecruitment(repo: IRecruitmentRepository) {
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [p, o] = await Promise.all([repo.listPositions(), repo.listOpenings()]);
    setPositions(p); setOpenings(o); setLoading(false);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const createPosition = useCallback(async (d: PositionFormData) => { const r = await repo.createPosition(d); if (r.ok) await load(); return r; }, [repo, load]);
  const updatePosition = useCallback(async (id: string, d: PositionFormData) => { const r = await repo.updatePosition(id, d); if (r.ok) await load(); return r; }, [repo, load]);
  const createOpening = useCallback(async (d: OpeningFormData) => { const r = await repo.createOpening(d); if (r.ok) await load(); return r; }, [repo, load]);
  const publishOpening = useCallback(async (id: string) => { const r = await repo.publishOpening(id); if (r.ok) await load(); return r; }, [repo, load]);
  const pauseOpening = useCallback(async (id: string) => { const r = await repo.setOpeningStatus(id, "paused"); if (r.ok) await load(); return r; }, [repo, load]);
  const closeOpening = useCallback(async (id: string) => { const r = await repo.setOpeningStatus(id, "closed"); if (r.ok) await load(); return r; }, [repo, load]);
  return { positions, openings, loading, refresh: load, createPosition, updatePosition, createOpening, publishOpening, pauseOpening, closeOpening };
}
