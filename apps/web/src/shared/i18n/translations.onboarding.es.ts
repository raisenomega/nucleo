import type { TranslationKey } from "./translations.keys";

// Diccionario de onboarding (RRHH-4). Se fusiona en translations.ts.
export const esOnboarding = {
  onboarding: "Onboarding", onboardingChecklist: "Empleados", onboardingTemplate: "Templates", startOnboarding: "Iniciar onboarding",
  taskCompleted: "Completada", taskPending: "En progreso", taskSkipped: "Omitida", signContract: "Firmar",
  uploadDocument: "Subir documento", markCompleted: "Marcar completada", skipTask: "Omitir", onboardingCompleted: "Onboarding completado",
  assignedToEmployee: "Empleado", assignedToAdmin: "Admin", mentor: "Mentor",
  legal: "Legal", it: "IT", equipment: "Equipos", introduction: "Introducción", otherCat: "Otro",
  progress: "Progreso", selectTemplate: "Template", defaultTemplate: "Template por defecto", createTemplate: "Nuevo template",
  taskCount: "Tareas", addTask: "Añadir tarea", taskTitle: "Título de la tarea", noOnboarding: "No tienes un onboarding activo",
} satisfies Partial<Record<TranslationKey, string>>;
