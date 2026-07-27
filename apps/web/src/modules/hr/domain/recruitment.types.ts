// BC hr — reclutamiento (puestos + vacantes + candidatos + pipeline). Puro.
export type EmploymentType = "full_time" | "part_time" | "contract" | "temporary" | "intern";
export type SalaryType = "hourly" | "salary" | "commission" | "mixed";
export type OpeningStatus = "draft" | "published" | "paused" | "closed" | "filled";
export type ApplicantStage = "applied" | "screening" | "documents" | "exams" | "interview" | "offer" | "hired" | "rejected" | "withdrawn";
export type InterviewRec = "apt" | "apt_with_reservations" | "not_apt" | null;
export type RecruitResult = { ok: true } | { ok: false; error: string };

// Stages activos del Kanban (los terminales rejected/withdrawn van aparte).
export const PIPELINE_STAGES: ApplicantStage[] = ["applied", "screening", "documents", "exams", "interview", "offer", "hired"];

export interface JobPosition {
  readonly id: string; readonly title: string; readonly department: string | null; readonly description: string | null;
  readonly responsibilities: string | null; readonly employmentType: EmploymentType; readonly schedule: string | null;
  readonly location: string | null; readonly isRemote: boolean; readonly salaryType: SalaryType;
  readonly salaryMin: number | null; readonly salaryMax: number | null; readonly currency: string;
  readonly requirements: readonly string[]; readonly requiredDocuments: readonly string[]; readonly skills: readonly string[];
  readonly minExperienceMonths: number; readonly educationLevel: string | null; readonly positionsCount: number; readonly isActive: boolean;
}
export interface JobOpening {
  readonly id: string; readonly positionId: string; readonly positionTitle: string; readonly openingNumber: string;
  readonly status: OpeningStatus; readonly publishedAt: string | null; readonly closesAt: string | null;
  readonly publicSlug: string | null; readonly publicToken: string; readonly customQuestions: readonly string[];
  readonly applicantCount: number; readonly notes: string | null;
}
export interface Applicant {
  readonly id: string; readonly openingId: string; readonly fullName: string; readonly email: string;
  readonly phone: string | null; readonly address: string | null; readonly city: string | null; readonly state: string | null;
  readonly zipCode: string | null; readonly coverLetter: string | null; readonly resumeUrl: string | null;
  readonly customAnswers: Readonly<Record<string, unknown>>; readonly stage: ApplicantStage;
  readonly documentsUploaded: readonly { readonly name: string; readonly url: string; readonly verified: boolean }[];
  readonly documentsVerified: boolean; readonly interviewScore: number | null; readonly interviewRecommendation: InterviewRec;
  readonly examScores: Readonly<Record<string, { readonly passed: boolean; readonly score: number }>>;
  readonly decisionNotes: string | null; readonly createdAt: string;
}
export interface PublicOpening {
  readonly openingId: string; readonly title: string; readonly department: string | null; readonly description: string | null;
  readonly responsibilities: string | null; readonly employmentType: EmploymentType; readonly schedule: string | null;
  readonly location: string | null; readonly isRemote: boolean; readonly salaryType: SalaryType;
  readonly salaryMin: number | null; readonly salaryMax: number | null; readonly currency: string;
  readonly requirements: readonly string[]; readonly skills: readonly string[]; readonly customQuestions: readonly string[]; readonly closesAt: string | null;
}
export interface PositionFormData {
  title: string; department: string; description: string; responsibilities: string; employmentType: EmploymentType;
  schedule: string; location: string; isRemote: boolean; salaryType: SalaryType; salaryMin: number | null;
  salaryMax: number | null; positionsCount: number; requirements: string[]; requiredDocuments: string[];
  skills: string[]; minExperienceMonths: number; educationLevel: string;
}
export interface OpeningFormData { positionId: string; closesAt: string | null; customQuestions: string[]; notes: string }
export interface ApplyData {
  fullName: string; email: string; phone: string; address: string; city: string; state: string;
  zipCode: string; coverLetter: string; customAnswers: Record<string, string>;
}

export interface IRecruitmentRepository {
  listPositions(): Promise<JobPosition[]>;
  createPosition(d: PositionFormData): Promise<RecruitResult>;
  updatePosition(id: string, d: PositionFormData): Promise<RecruitResult>;
  listOpenings(): Promise<JobOpening[]>;
  createOpening(d: OpeningFormData): Promise<RecruitResult>;
  publishOpening(id: string): Promise<RecruitResult>;
  setOpeningStatus(id: string, status: "paused" | "closed"): Promise<RecruitResult>;
  pipeline(openingId: string): Promise<Record<string, Applicant[]>>;
  advance(id: string, toStage: ApplicantStage): Promise<RecruitResult>;
  reject(id: string, reason: string): Promise<RecruitResult>;
  convert(id: string): Promise<RecruitResult>;
  getPublic(token: string): Promise<PublicOpening | null>;
  apply(openingId: string, d: ApplyData): Promise<{ ok: true; id: string } | { ok: false; error: string }>;
}
