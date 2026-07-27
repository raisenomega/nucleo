import type { TranslationKey } from "@shared/i18n";
import type { ApplicantStage, OpeningStatus, EmploymentType, SalaryType } from "@hr/domain/recruitment.types";

export const STAGE_KEY: Record<ApplicantStage, TranslationKey> = {
  applied: "applied", screening: "screening", documents: "documents", exams: "exams",
  interview: "interview", offer: "offer", hired: "hired", rejected: "rejected", withdrawn: "withdrawn",
};
export const STATUS_KEY: Record<OpeningStatus, TranslationKey> = {
  draft: "osDraft", published: "osPublished", paused: "osPaused", closed: "osClosed", filled: "osFilled",
};
export const STATUS_COLOR: Record<OpeningStatus, string> = {
  draft: "bg-secondary text-muted-foreground",
  published: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  paused: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  closed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  filled: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
};
export const EMP_KEY: Record<EmploymentType, TranslationKey> = {
  full_time: "fullTime", part_time: "partTime", contract: "contract", temporary: "temporary", intern: "intern",
};
export const SALARY_KEY: Record<SalaryType, TranslationKey> = {
  hourly: "salaryHourly", salary: "salarySalary", commission: "salaryCommission", mixed: "salaryMixed",
};

// "$18-25" (sin sufijo de unidad; el llamador añade /hr o /mes si aplica). "" si no hay rango.
export function payRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "";
  if (min != null && max != null) return `$${min}-${max}`;
  return `$${min ?? max}`;
}

// Días transcurridos desde una fecha ISO (para "hace N días").
export function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}
