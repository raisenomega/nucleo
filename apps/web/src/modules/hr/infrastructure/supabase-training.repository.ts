import { supabase } from "@shared/lib/supabase";
import type {
  ITrainingRepository, Course, CourseInput, Enrollment, EnrollStatus, TrainingSummaryRow, TrResult,
} from "@hr/domain/training.types";

interface ERow {
  id: string; employee_id: string; course_id: string; status: string; due_date: string | null;
  completed_at: string | null; score: number | string | null;
  profiles: { full_name: string } | null; training_courses: { title: string; required: boolean } | null;
}
const ESEL = "id,employee_id,course_id,status,due_date,completed_at,score,profiles:employee_id(full_name),training_courses:course_id(title,required)";
const ok = (e: { message: string } | null): TrResult => (e ? { ok: false, error: e.message } : { ok: true });
const toEnroll = (r: ERow): Enrollment => ({
  id: r.id, employeeId: r.employee_id, employeeName: r.profiles?.full_name ?? "—", courseId: r.course_id,
  courseTitle: r.training_courses?.title ?? "—", courseRequired: r.training_courses?.required ?? false,
  status: r.status as EnrollStatus, dueDate: r.due_date, completedAt: r.completed_at, score: r.score != null ? Number(r.score) : null,
});

export const supabaseTrainingRepository: ITrainingRepository = {
  async listCourses(): Promise<Course[]> {
    const { data } = await supabase.from("training_courses").select("id,title,description,category,hours,required,active").eq("active", true).order("title");
    return ((data as { id: string; title: string; description: string | null; category: string | null; hours: number | string | null; required: boolean; active: boolean }[] | null) ?? [])
      .map((c) => ({ ...c, hours: c.hours != null ? Number(c.hours) : null }));
  },
  async saveCourse(id, c: CourseInput): Promise<TrResult> {
    const row = { title: c.title, description: c.description || null, category: c.category || null, hours: c.hours || null, required: c.required };
    return ok((id ? await supabase.from("training_courses").update(row).eq("id", id) : await supabase.from("training_courses").insert(row)).error);
  },
  async removeCourse(id): Promise<TrResult> { return ok((await supabase.from("training_courses").update({ active: false }).eq("id", id)).error); },
  async listEnrollments(): Promise<Enrollment[]> {
    const { data } = await supabase.from("training_enrollments").select(ESEL).order("created_at", { ascending: false });
    return ((data as unknown as ERow[] | null) ?? []).map(toEnroll);
  },
  async listForEmployee(employeeId): Promise<Enrollment[]> {
    const { data } = await supabase.from("training_enrollments").select(ESEL).eq("employee_id", employeeId);
    return ((data as unknown as ERow[] | null) ?? []).map(toEnroll);
  },
  async assign(employeeId, courseId, dueDate): Promise<TrResult> {
    return ok((await supabase.from("training_enrollments").insert({ employee_id: employeeId, course_id: courseId, due_date: dueDate })).error);
  },
  async setStatus(id, status: EnrollStatus, score): Promise<TrResult> {
    return ok((await supabase.from("training_enrollments").update({
      status, score, completed_at: status === "completed" ? new Date().toISOString() : null,
    }).eq("id", id)).error);
  },
  async removeEnrollment(id): Promise<TrResult> { return ok((await supabase.from("training_enrollments").delete().eq("id", id)).error); },
  async summary(): Promise<TrainingSummaryRow[]> {
    const { data } = await supabase.rpc("get_training_summary");
    return (data as TrainingSummaryRow[] | null) ?? [];
  },
};
