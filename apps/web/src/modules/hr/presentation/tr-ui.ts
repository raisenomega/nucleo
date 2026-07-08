import type { TranslationKey } from "@shared/i18n";
import type { EnrollStatus } from "@hr/domain/training.types";

export const ENROLL_KEY: Record<EnrollStatus, TranslationKey> = {
  not_started: "stNotStarted", in_progress: "stInProgress", completed: "stCompleted", expired: "stExpired",
};
export const ENROLL_COLOR: Record<EnrollStatus, string> = {
  not_started: "bg-secondary", in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", expired: "bg-red-100 text-red-800",
};
