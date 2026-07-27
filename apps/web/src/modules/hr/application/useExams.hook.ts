import { useCallback, useEffect, useState } from "react";
import type { IScreeningRepository, RecruitmentExam, ExamFormData } from "@hr/domain/screening.types";

// DI del repo de exámenes (staff). Carga la lista; crear/editar refresca.
export function useExams(repo: IScreeningRepository) {
  const [exams, setExams] = useState<RecruitmentExam[]>([]);
  const load = useCallback(async () => { setExams(await repo.listExams()); }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const createExam = useCallback(async (d: ExamFormData) => { const r = await repo.createExam(d); if (r.ok) await load(); return r; }, [repo, load]);
  const updateExam = useCallback(async (id: string, d: ExamFormData) => { const r = await repo.updateExam(id, d); if (r.ok) await load(); return r; }, [repo, load]);
  return { exams, refresh: load, createExam, updateExam };
}
