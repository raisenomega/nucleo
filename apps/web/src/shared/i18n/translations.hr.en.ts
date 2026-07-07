import type { TranslationKey } from "./translations.keys";

// Supplementary dictionary (HR / evaluations). Merged in translations.ts.
export const enHr = {
  evaluationsSubtitle: "Weighted performance scoring + PR compliance (Act 80)",
  newEvaluation: "New evaluation", autoSuggest: "Auto-suggest from data",
  composite: "Composite score", classification: "Classification",
  clExcelente: "Excellent", clBueno: "Good", clNecesitaMejora: "Needs improvement", clInsuficiente: "Insufficient",
  legalWarning: "Requires legal validation (Act 80): dismissal with documented cause.",
} satisfies Partial<Record<TranslationKey, string>>;
