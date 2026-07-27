import { supabase } from "@shared/lib/supabase";
import { examsRepo } from "@hr/infrastructure/supabase-exams.repository";
import type {
  IScreeningRepository, ScreeningStatus, PublicExam, ExamResult, Answer, ExamQuestion, ScreeningDoc, ScreeningExam,
} from "@hr/domain/screening.types";
import type { RecruitResult } from "@hr/domain/recruitment.types";

const num = (v: unknown): number | null => (v != null ? Number(v) : null);

const toStatus = (d: Record<string, unknown>): ScreeningStatus => {
  const docs = d.documents as { required: string[]; uploaded: ScreeningDoc[]; complete: boolean };
  return {
    applicantName: d.applicant_name as string, positionTitle: (d.position_title as string) ?? "—", stage: d.stage as string,
    documents: { required: docs?.required ?? [], uploaded: docs?.uploaded ?? [], complete: !!docs?.complete },
    exams: ((d.exams as Record<string, unknown>[]) ?? []).map((e): ScreeningExam => ({
      examId: e.exam_id as string, title: e.title as string, status: e.status as ScreeningExam["status"],
      score: num(e.score), attemptsUsed: Number(e.attempts_used ?? 0), maxAttempts: Number(e.max_attempts ?? 0) })),
    autoRejected: !!d.auto_rejected,
  };
};

export const supabaseScreeningRepository: IScreeningRepository = {
  ...examsRepo,
  async getStatus(applicantId): Promise<ScreeningStatus | null> {
    const { data } = await supabase.rpc("get_applicant_screening_status", { p_applicant_id: applicantId });
    const d = data as Record<string, unknown> | null;
    return d && !d.error ? toStatus(d) : null;
  },
  async getExam(applicantId, examId): Promise<PublicExam | null> {
    const { data } = await supabase.rpc("get_exam_for_applicant", { p_applicant_id: applicantId, p_exam_id: examId });
    const d = data as Record<string, unknown> | null;
    if (!d || d.error) return null;
    return { status: d.status as PublicExam["status"], examId: d.exam_id as string, title: d.title as string,
      description: (d.description as string) ?? null, questions: (d.questions as ExamQuestion[]) ?? [],
      passingScore: num(d.passing_score) ?? 0, timeLimitMinutes: num(d.time_limit_minutes),
      attemptsUsed: Number(d.attempts_used ?? 0), maxAttempts: Number(d.max_attempts ?? 0), score: num(d.score) ?? undefined };
  },
  async submitExam(applicantId, examId, answers: Record<string, Answer>): Promise<ExamResult | { error: string }> {
    const { data, error } = await supabase.rpc("submit_exam_attempt", { p_applicant_id: applicantId, p_exam_id: examId, p_answers: answers });
    if (error) return { error: error.message };
    const d = data as Record<string, unknown>;
    return { score: Number(d.score), passed: !!d.passed, earned: Number(d.earned), total: Number(d.total),
      attemptsUsed: Number(d.attempts_used), maxAttempts: Number(d.max_attempts), feedback: (d.feedback as Record<string, unknown>) ?? null };
  },
  async uploadDocument(applicantId, name, file: File): Promise<RecruitResult> {
    const { data: path, error: pe } = await supabase.rpc("get_applicant_upload_path", { p_applicant_id: applicantId, p_filename: file.name });
    if (pe || !path) return { ok: false, error: pe?.message ?? "path" };
    const up = await supabase.storage.from("applicant-docs").upload(path as string, file);
    if (up.error) return { ok: false, error: up.error.message };
    const { error } = await supabase.rpc("upload_applicant_document", { p_applicant_id: applicantId, p_document_name: name, p_document_url: path });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
