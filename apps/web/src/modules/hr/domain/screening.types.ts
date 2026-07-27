// BC hr — screening (exámenes + verificación de documentos). Puro.
import type { RecruitResult } from "@hr/domain/recruitment.types";

export type QuestionType = "multiple_choice" | "multiple_select" | "true_false";
export interface ExamOption { readonly id: string; readonly text: string }
export interface ExamQuestion {
  readonly id: string; readonly text: string; readonly type: QuestionType; readonly statement?: string;
  readonly options?: readonly ExamOption[]; readonly correct?: string | readonly string[] | boolean; readonly points: number;
}
export interface RecruitmentExam {
  readonly id: string; readonly title: string; readonly description: string | null; readonly questions: readonly ExamQuestion[];
  readonly passingScore: number; readonly maxAttempts: number; readonly timeLimitMinutes: number | null;
  readonly shuffleQuestions: boolean; readonly shuffleOptions: boolean; readonly showCorrectAnswers: boolean; readonly isActive: boolean;
}
export interface ExamFormData {
  title: string; description: string; passingScore: number; maxAttempts: number; timeLimitMinutes: number | null;
  shuffleQuestions: boolean; shuffleOptions: boolean; showCorrectAnswers: boolean; questions: ExamQuestion[];
}
export type ExamViewStatus = "available" | "passed" | "exhausted" | "not_found";
export interface PublicExam {
  readonly status: ExamViewStatus; readonly examId?: string; readonly title: string; readonly description?: string | null;
  readonly questions?: readonly ExamQuestion[]; readonly passingScore?: number; readonly timeLimitMinutes?: number | null;
  readonly attemptsUsed: number; readonly maxAttempts: number; readonly score?: number;
}
export interface ExamResult {
  readonly score: number; readonly passed: boolean; readonly earned: number; readonly total: number;
  readonly attemptsUsed: number; readonly maxAttempts: number; readonly feedback: Record<string, unknown> | null;
}
export interface ScreeningDoc { readonly name: string; readonly url: string; readonly verified: boolean }
export interface ScreeningExam {
  readonly examId: string; readonly title: string; readonly status: "passed" | "failed" | "pending";
  readonly score: number | null; readonly attemptsUsed: number; readonly maxAttempts: number;
}
export interface ScreeningStatus {
  readonly applicantName: string; readonly positionTitle: string; readonly stage: string;
  readonly documents: { readonly required: readonly string[]; readonly uploaded: readonly ScreeningDoc[]; readonly complete: boolean };
  readonly exams: readonly ScreeningExam[]; readonly autoRejected: boolean;
}
export type Answer = string | string[] | boolean;

export interface IScreeningRepository {
  listExams(): Promise<RecruitmentExam[]>;
  createExam(d: ExamFormData): Promise<RecruitResult>;
  updateExam(id: string, d: ExamFormData): Promise<RecruitResult>;
  verifyDocument(applicantId: string, name: string, verified: boolean): Promise<RecruitResult>;
  signDoc(path: string): Promise<string | null>;
  getStatus(applicantId: string): Promise<ScreeningStatus | null>;
  getExam(applicantId: string, examId: string): Promise<PublicExam | null>;
  submitExam(applicantId: string, examId: string, answers: Record<string, Answer>): Promise<ExamResult | { error: string }>;
  uploadDocument(applicantId: string, name: string, file: File): Promise<RecruitResult>;
}
