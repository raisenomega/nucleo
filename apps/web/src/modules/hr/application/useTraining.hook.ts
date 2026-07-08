import { useCallback, useEffect, useState } from "react";
import type {
  ITrainingRepository, Course, CourseInput, Enrollment, EnrollStatus, TrainingSummaryRow,
} from "@hr/domain/training.types";

export function useTraining(repo: ITrainingRepository) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [summary, setSummary] = useState<TrainingSummaryRow[]>([]);
  const load = useCallback(async () => {
    const [c, e, s] = await Promise.all([repo.listCourses(), repo.listEnrollments(), repo.summary()]);
    setCourses(c); setEnrollments(e); setSummary(s);
  }, [repo]);
  useEffect(() => { void load(); }, [load]);
  const saveCourse = useCallback(async (id: string | null, c: CourseInput) => { const r = await repo.saveCourse(id, c); if (r.ok) await load(); return r; }, [repo, load]);
  const removeCourse = useCallback(async (id: string) => { const r = await repo.removeCourse(id); if (r.ok) await load(); return r; }, [repo, load]);
  const assign = useCallback(async (emp: string, course: string, due: string | null) => { const r = await repo.assign(emp, course, due); if (r.ok) await load(); return r; }, [repo, load]);
  const setStatus = useCallback(async (id: string, st: EnrollStatus, score: number | null) => { const r = await repo.setStatus(id, st, score); if (r.ok) await load(); return r; }, [repo, load]);
  const removeEnrollment = useCallback(async (id: string) => { const r = await repo.removeEnrollment(id); if (r.ok) await load(); return r; }, [repo, load]);
  return { courses, enrollments, summary, saveCourse, removeCourse, assign, setStatus, removeEnrollment };
}
