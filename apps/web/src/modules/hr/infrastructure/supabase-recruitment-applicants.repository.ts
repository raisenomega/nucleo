import { supabase } from "@shared/lib/supabase";
import type { Applicant, ApplyData, PublicOpening, RecruitResult } from "@hr/domain/recruitment.types";

const ok = (e: { message: string } | null): RecruitResult => (e ? { ok: false, error: e.message } : { ok: true });
const num = (v: unknown): number | null => (v != null ? Number(v) : null);
const ASEL = "id,opening_id,full_name,email,phone,address,city,state,zip_code,cover_letter,resume_url,custom_answers,stage,documents_uploaded,documents_verified,interview_score,interview_recommendation,decision_notes,created_at";

const toApplicant = (r: Record<string, unknown>): Applicant => ({
  id: r.id as string, openingId: r.opening_id as string, fullName: r.full_name as string, email: r.email as string,
  phone: (r.phone as string) ?? null, address: (r.address as string) ?? null, city: (r.city as string) ?? null,
  state: (r.state as string) ?? null, zipCode: (r.zip_code as string) ?? null, coverLetter: (r.cover_letter as string) ?? null,
  resumeUrl: (r.resume_url as string) ?? null, customAnswers: (r.custom_answers as Record<string, unknown>) ?? {},
  stage: r.stage as Applicant["stage"],
  documentsUploaded: (Array.isArray(r.documents_uploaded) ? r.documents_uploaded : []) as Applicant["documentsUploaded"],
  documentsVerified: !!r.documents_verified, interviewScore: num(r.interview_score),
  interviewRecommendation: (r.interview_recommendation as Applicant["interviewRecommendation"]) ?? null,
  decisionNotes: (r.decision_notes as string) ?? null, createdAt: r.created_at as string,
});

const toPublic = (d: Record<string, unknown>): PublicOpening => ({
  openingId: d.opening_id as string, title: d.title as string, department: (d.department as string) ?? null,
  description: (d.description as string) ?? null, responsibilities: (d.responsibilities as string) ?? null,
  employmentType: d.employment_type as PublicOpening["employmentType"], schedule: (d.schedule as string) ?? null,
  location: (d.location as string) ?? null, isRemote: !!d.is_remote, salaryType: d.salary_type as PublicOpening["salaryType"],
  salaryMin: num(d.salary_min), salaryMax: num(d.salary_max), currency: (d.currency as string) ?? "USD",
  requirements: (Array.isArray(d.requirements) ? d.requirements : []) as string[],
  skills: (Array.isArray(d.skills) ? d.skills : []) as string[],
  customQuestions: (Array.isArray(d.custom_questions) ? d.custom_questions : []) as string[], closesAt: (d.closes_at as string) ?? null,
});

export const recruitApplicants = {
  async pipeline(openingId: string): Promise<Record<string, Applicant[]>> {
    const { data } = await supabase.from("applicants").select(ASEL).eq("opening_id", openingId).order("created_at");
    const grouped: Record<string, Applicant[]> = {};
    for (const row of (data as Record<string, unknown>[] | null) ?? []) {
      const a = toApplicant(row); (grouped[a.stage] ??= []).push(a);
    }
    return grouped;
  },
  async advance(id: string, toStage: string): Promise<RecruitResult> {
    return ok((await supabase.rpc("advance_applicant", { p_applicant_id: id, p_to_stage: toStage })).error);
  },
  async reject(id: string, reason: string): Promise<RecruitResult> {
    return ok((await supabase.rpc("reject_applicant", { p_applicant_id: id, p_reason: reason || null })).error);
  },
  async convert(id: string): Promise<RecruitResult> {
    return ok((await supabase.rpc("convert_applicant_to_employee", { p_applicant_id: id })).error);
  },
  async getPublic(token: string): Promise<PublicOpening | null> {
    const { data } = await supabase.rpc("get_public_opening", { p_token: token });
    return data ? toPublic(data as Record<string, unknown>) : null;
  },
  async apply(openingId: string, d: ApplyData): Promise<RecruitResult> {
    return ok((await supabase.rpc("apply_to_opening", { p_opening_id: openingId, p_full_name: d.fullName, p_email: d.email,
      p_phone: d.phone || null, p_address: d.address || null, p_city: d.city || null, p_state: d.state || null,
      p_zip_code: d.zipCode || null, p_cover_letter: d.coverLetter || null, p_custom_answers: d.customAnswers })).error);
  },
};
