import { supabase } from "@shared/lib/supabase";
import type { RecruitmentExam, ExamFormData, ExamQuestion } from "@hr/domain/screening.types";
import type { RecruitResult } from "@hr/domain/recruitment.types";

const ok = (e: { message: string } | null): RecruitResult => (e ? { ok: false, error: e.message } : { ok: true });
const XSEL = "id,title,description,questions,passing_score,max_attempts,time_limit_minutes,shuffle_questions,shuffle_options,show_correct_answers,is_active";

const toExam = (r: Record<string, unknown>): RecruitmentExam => ({
  id: r.id as string, title: r.title as string, description: (r.description as string) ?? null,
  questions: (Array.isArray(r.questions) ? r.questions : []) as ExamQuestion[],
  passingScore: Number(r.passing_score ?? 70), maxAttempts: Number(r.max_attempts ?? 2),
  timeLimitMinutes: r.time_limit_minutes != null ? Number(r.time_limit_minutes) : null,
  shuffleQuestions: !!r.shuffle_questions, shuffleOptions: !!r.shuffle_options,
  showCorrectAnswers: !!r.show_correct_answers, isActive: !!r.is_active,
});
const examData = (d: ExamFormData) => ({
  title: d.title, description: d.description || null, questions: d.questions, passing_score: d.passingScore,
  max_attempts: d.maxAttempts, time_limit_minutes: d.timeLimitMinutes, shuffle_questions: d.shuffleQuestions,
  shuffle_options: d.shuffleOptions, show_correct_answers: d.showCorrectAnswers,
});

export const examsRepo = {
  async listExams(): Promise<RecruitmentExam[]> {
    const { data } = await supabase.from("recruitment_exams").select(XSEL).order("created_at", { ascending: false });
    return ((data as Record<string, unknown>[] | null) ?? []).map(toExam);
  },
  async createExam(d: ExamFormData): Promise<RecruitResult> {
    return ok((await supabase.rpc("create_recruitment_exam", { p_data: examData(d) })).error);
  },
  async updateExam(id: string, d: ExamFormData): Promise<RecruitResult> {
    return ok((await supabase.rpc("update_recruitment_exam", { p_id: id, p_data: examData(d) })).error);
  },
  async verifyDocument(applicantId: string, name: string, verified: boolean): Promise<RecruitResult> {
    return ok((await supabase.rpc("verify_applicant_document", { p_applicant_id: applicantId, p_document_name: name, p_verified: verified })).error);
  },
  async signDoc(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from("applicant-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
};
