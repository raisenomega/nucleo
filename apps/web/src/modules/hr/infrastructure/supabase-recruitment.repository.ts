import { supabase } from "@shared/lib/supabase";
import type {
  IRecruitmentRepository, JobPosition, JobOpening, PositionFormData, OpeningFormData, RecruitResult,
} from "@hr/domain/recruitment.types";
import { recruitApplicants } from "@hr/infrastructure/supabase-recruitment-applicants.repository";

const ok = (e: { message: string } | null): RecruitResult => (e ? { ok: false, error: e.message } : { ok: true });
const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
const PSEL = "id,title,department,description,responsibilities,employment_type,schedule,location,is_remote,salary_type,salary_min,salary_max,currency,requirements,required_documents,skills,min_experience_months,education_level,positions_count,is_active";
const OSEL = "id,position_id,opening_number,status,published_at,closes_at,public_slug,public_token,custom_questions,applicant_count,notes,job_positions:position_id(title)";

const toPos = (r: Record<string, unknown>): JobPosition => ({
  id: r.id as string, title: r.title as string, department: (r.department as string) ?? null,
  description: (r.description as string) ?? null, responsibilities: (r.responsibilities as string) ?? null,
  employmentType: r.employment_type as JobPosition["employmentType"], schedule: (r.schedule as string) ?? null,
  location: (r.location as string) ?? null, isRemote: !!r.is_remote, salaryType: r.salary_type as JobPosition["salaryType"],
  salaryMin: r.salary_min != null ? Number(r.salary_min) : null, salaryMax: r.salary_max != null ? Number(r.salary_max) : null,
  currency: (r.currency as string) ?? "USD", requirements: arr(r.requirements), requiredDocuments: arr(r.required_documents),
  skills: arr(r.skills), minExperienceMonths: Number(r.min_experience_months ?? 0),
  educationLevel: (r.education_level as string) ?? null, positionsCount: Number(r.positions_count ?? 1), isActive: !!r.is_active,
});
const toOpening = (r: Record<string, unknown>): JobOpening => ({
  id: r.id as string, positionId: r.position_id as string,
  positionTitle: (r.job_positions as { title: string } | null)?.title ?? "—", openingNumber: r.opening_number as string,
  status: r.status as JobOpening["status"], publishedAt: (r.published_at as string) ?? null, closesAt: (r.closes_at as string) ?? null,
  publicSlug: (r.public_slug as string) ?? null, publicToken: r.public_token as string, customQuestions: arr(r.custom_questions),
  applicantCount: Number(r.applicant_count ?? 0), notes: (r.notes as string) ?? null,
});
const posData = (d: PositionFormData) => ({
  title: d.title, department: d.department || null, description: d.description || null, responsibilities: d.responsibilities || null,
  employment_type: d.employmentType, schedule: d.schedule || null, location: d.location || null, is_remote: d.isRemote,
  salary_type: d.salaryType, salary_min: d.salaryMin, salary_max: d.salaryMax, positions_count: d.positionsCount,
  requirements: d.requirements, required_documents: d.requiredDocuments, skills: d.skills,
  min_experience_months: d.minExperienceMonths, education_level: d.educationLevel || null,
});

export const supabaseRecruitmentRepository: IRecruitmentRepository = {
  async listPositions() {
    const { data } = await supabase.from("job_positions").select(PSEL).order("created_at", { ascending: false });
    return ((data as Record<string, unknown>[] | null) ?? []).map(toPos);
  },
  async createPosition(d) { return ok((await supabase.rpc("create_job_position", { p_data: posData(d) })).error); },
  async updatePosition(id, d) { return ok((await supabase.rpc("update_job_position", { p_id: id, p_data: posData(d) })).error); },
  async listOpenings() {
    const { data } = await supabase.from("job_openings").select(OSEL).order("created_at", { ascending: false });
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map(toOpening);
  },
  async createOpening(d: OpeningFormData) {
    return ok((await supabase.rpc("create_job_opening", { p_position_id: d.positionId, p_closes_at: d.closesAt,
      p_custom_questions: d.customQuestions, p_notes: d.notes || null })).error);
  },
  async publishOpening(id) { return ok((await supabase.rpc("publish_job_opening", { p_opening_id: id })).error); },
  async setOpeningStatus(id, status) { return ok((await supabase.rpc("set_job_opening_status", { p_opening_id: id, p_status: status })).error); },
  ...recruitApplicants,
};
