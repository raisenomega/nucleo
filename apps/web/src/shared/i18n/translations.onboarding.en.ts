import type { TranslationKey } from "./translations.keys";

// Onboarding dictionary (RRHH-4). Merged into translations.ts.
export const enOnboarding = {
  onboarding: "Onboarding", onboardingChecklist: "Employees", onboardingTemplate: "Templates", startOnboarding: "Start onboarding",
  taskCompleted: "Completed", taskPending: "In progress", taskSkipped: "Skipped", signContract: "Sign",
  uploadDocument: "Upload document", markCompleted: "Mark completed", skipTask: "Skip", onboardingCompleted: "Onboarding completed",
  assignedToEmployee: "Employee", assignedToAdmin: "Admin", mentor: "Mentor",
  legal: "Legal", it: "IT", equipment: "Equipment", introduction: "Introduction", otherCat: "Other",
  progress: "Progress", selectTemplate: "Template", defaultTemplate: "Default template", createTemplate: "New template",
  taskCount: "Tasks", addTask: "Add task", taskTitle: "Task title", noOnboarding: "You have no active onboarding",
} satisfies Partial<Record<TranslationKey, string>>;
