import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (RRHH / evaluaciones). Se fusiona en translations.ts.
export const esHr = {
  evaluationsSubtitle: "Scoring de desempeño ponderado + compliance PR (Ley 80)",
  newEvaluation: "Nueva evaluación", autoSuggest: "Auto-sugerir desde datos",
  composite: "Score compuesto", classification: "Clasificación",
  clExcelente: "Excelente", clBueno: "Bueno", clNecesitaMejora: "Necesita mejora", clInsuficiente: "Insuficiente",
  legalWarning: "Requiere validación legal (Ley 80): despido con causa documentada.",
  observations: "Observaciones", observationsSubtitle: "Bitácora de coaching e incidentes por empleado",
  newObservation: "Nueva observación", followUp: "Fecha de seguimiento", recentObservations: "Observaciones recientes",
  obsLogro: "Logro", obsMejora: "Oportunidad de mejora", obsIncidente: "Incidente",
  obsCultural: "Comportamiento cultural", obsDesarrollo: "Sugerencia de desarrollo",
} satisfies Partial<Record<TranslationKey, string>>;
