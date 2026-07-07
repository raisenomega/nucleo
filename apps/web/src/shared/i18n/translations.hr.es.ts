import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (RRHH / evaluaciones). Se fusiona en translations.ts.
export const esHr = {
  evaluationsSubtitle: "Scoring de desempeño ponderado + compliance PR (Ley 80)",
  newEvaluation: "Nueva evaluación", autoSuggest: "Auto-sugerir desde datos",
  composite: "Score compuesto", classification: "Clasificación",
  clExcelente: "Excelente", clBueno: "Bueno", clNecesitaMejora: "Necesita mejora", clInsuficiente: "Insuficiente",
  legalWarning: "Requiere validación legal (Ley 80): despido con causa documentada.",
} satisfies Partial<Record<TranslationKey, string>>;
