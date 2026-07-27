import { Scale, FileText, Monitor, GraduationCap, Wrench, Users, ListChecks } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@shared/i18n";
import type { TaskCategory } from "@hr/domain/onboarding.types";

export const CATEGORIES: TaskCategory[] = ["legal", "documents", "it", "training", "equipment", "introduction", "other"];
export const CAT_ICON: Record<TaskCategory, LucideIcon> = {
  legal: Scale, documents: FileText, it: Monitor, training: GraduationCap, equipment: Wrench, introduction: Users, other: ListChecks,
};
export const CAT_KEY: Record<TaskCategory, TranslationKey> = {
  legal: "legal", documents: "documents", it: "it", training: "training", equipment: "equipment", introduction: "introduction", other: "otherCat",
};

// Vencida = pendiente con fecha límite pasada.
export const isOverdue = (due: string | null, status: string): boolean =>
  status !== "completed" && status !== "skipped" && due != null && due < new Date().toISOString().slice(0, 10);
