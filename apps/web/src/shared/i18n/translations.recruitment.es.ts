import type { TranslationKey } from "./translations.keys";

// Diccionario de reclutamiento (RRHH-1A). Se fusiona en translations.ts.
export const esRecruitment = {
  recruitment: "Reclutamiento", jobPositions: "Puestos", jobOpenings: "Vacantes", pipeline: "Pipeline",
  createPosition: "Nuevo puesto", editPosition: "Editar puesto", createOpening: "Nueva vacante",
  publishOpening: "Publicar", closeOpening: "Cerrar", jobTitle: "Título del puesto", employmentType: "Tipo de empleo",
  salary: "Salario", positionsCount: "Plazas", salaryMin: "Salario mín.", salaryMax: "Salario máx.", remote: "Remoto",
  requirements: "Requisitos", requiredDocuments: "Documentos requeridos", skills: "Habilidades", responsibilities: "Responsabilidades",
  vacancyNumber: "Nº", candidateCount: "Candidatos", copyLink: "Copiar link", linkCopied: "Link copiado",
  closingDate: "Fecha límite", customQuestions: "Preguntas adicionales", advance: "Avanzar", hireApplicant: "Contratar",
  score: "Score", daysUnit: "días", confirmHire: "¿Contratar a este candidato? Se le enviará una invitación por email.",
  applicantHired: "Candidato contratado. Invitación enviada.", coverLetter: "Carta de presentación",
  applyNow: "Enviar aplicación", thankYouForApplying: "¡Gracias por aplicar!", applicationSent: "Te contactaremos por email.",
  positionClosed: "Esta vacante ya no está disponible.", loading: "Cargando…", fullName: "Nombre completo",
  stateField: "Estado", zipCode: "Código postal",
  applied: "Aplicados", screening: "Screening", exams: "Exámenes", interview: "Entrevista", offer: "Oferta",
  hired: "Contratados", rejected: "Rechazados", withdrawn: "Retirados",
  osDraft: "Borrador", osPublished: "Publicada", osPaused: "Pausada", osClosed: "Cerrada", osFilled: "Cubierta",
  fullTime: "Tiempo completo", partTime: "Medio tiempo", contract: "Contrato", temporary: "Temporal", intern: "Pasante",
  salaryHourly: "Por hora", salarySalary: "Salario", salaryCommission: "Comisión", salaryMixed: "Mixto", schedule: "Horario",
} satisfies Partial<Record<TranslationKey, string>>;
