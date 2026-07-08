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
  anonymous: "Anónimo", author: "Autor", acknowledge: "Acusar recibo",
  evTopDown: "Evaluación formal", evPeer: "Peer review", evBottomUp: "Bottom-up (a mi jefe)", evSelf: "Auto-evaluación",
  fbTab: "Feedback", newFeedback: "Nueva opinión", fbGeneral: "Empresa (general)", fbContent: "Escribe tu opinión…",
  fbSuggestion: "Sugerencia", fbPraise: "Reconocimiento", fbConcern: "Preocupación", fbCulture: "Cultura", fbTip: "Anónimo",
  currentPeriod: "Período actual", freqWeekly: "Semanal", freqBiweekly: "Quincenal", freqMonthly: "Mensual",
  periodFeedback: "Feedback del período",
  trainingSubtitle: "Cursos + asignaciones + cumplimiento", courses: "Cursos", assignments: "Asignaciones",
  newCourse: "Nuevo curso", assignCourse: "Asignar curso", courseTitle: "Título del curso", hours: "Horas",
  required: "Obligatorio", completion: "Cumplimiento", markComplete: "Marcar completado", course: "Curso", trainingPct: "Capacitación",
  stNotStarted: "Sin iniciar", stInProgress: "En progreso", stCompleted: "Completado", stExpired: "Vencido",
} satisfies Partial<Record<TranslationKey, string>>;
