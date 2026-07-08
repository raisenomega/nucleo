// BC hr — capacitación (cursos + asignaciones). Puro.
export type TrResult = { ok: true } | { ok: false; error: string };
export type EnrollStatus = "not_started" | "in_progress" | "completed" | "expired";

export interface Course {
  readonly id: string; readonly title: string; readonly description: string | null;
  readonly category: string | null; readonly hours: number | null; readonly required: boolean; readonly active: boolean;
}
export interface CourseInput { title: string; description: string; category: string; hours: number; required: boolean; }
export interface Enrollment {
  readonly id: string; readonly employeeId: string; readonly employeeName: string;
  readonly courseId: string; readonly courseTitle: string; readonly courseRequired: boolean;
  readonly status: EnrollStatus; readonly dueDate: string | null; readonly completedAt: string | null; readonly score: number | null;
}
export interface TrainingSummaryRow {
  readonly employeeId: string; readonly name: string;
  readonly assigned: number; readonly completed: number; readonly overdue: number; readonly completionRate: number;
}

export interface ITrainingRepository {
  listCourses(): Promise<Course[]>;
  saveCourse(id: string | null, c: CourseInput): Promise<TrResult>;
  removeCourse(id: string): Promise<TrResult>;
  listEnrollments(): Promise<Enrollment[]>;
  listForEmployee(employeeId: string): Promise<Enrollment[]>;
  assign(employeeId: string, courseId: string, dueDate: string | null): Promise<TrResult>;
  setStatus(id: string, status: EnrollStatus, score: number | null): Promise<TrResult>;
  removeEnrollment(id: string): Promise<TrResult>;
  summary(): Promise<TrainingSummaryRow[]>;
}
