// BC hr — onboarding (templates + checklist + tareas). Puro.
export type TaskCategory = "legal" | "documents" | "it" | "training" | "equipment" | "introduction" | "other";
export type TaskStatus = "pending" | "in_progress" | "completed" | "skipped";
export type OnbResult = { ok: true } | { ok: false; error: string };

export interface OnboardingTask {
  readonly id: string; readonly title: string; readonly description: string | null; readonly category: TaskCategory;
  readonly assignedTo: "employee" | "admin" | "mentor"; readonly taskOrder: number;
  readonly requiresSignature: boolean; readonly requiresDocument: boolean; readonly linkedTrainingId: string | null;
  readonly status: TaskStatus; readonly completedAt: string | null; readonly dueDate: string | null; readonly documentUrl: string | null;
}
export interface OnboardingChecklist {
  readonly id: string; readonly employeeId: string; readonly employeeName: string; readonly positionTitle: string | null;
  readonly status: "in_progress" | "completed" | "cancelled"; readonly totalTasks: number; readonly completedTasks: number; readonly startedAt: string;
}
export interface OnboardingStatus { readonly checklist: OnboardingChecklist; readonly tasks: readonly OnboardingTask[] }

export interface TemplateTask {
  id: string; title: string; description: string; category: TaskCategory; assignedTo: "employee" | "admin" | "mentor";
  requiresSignature: boolean; requiresDocument: boolean; dueDays: number; order: number;
}
export interface OnboardingTemplate {
  readonly id: string; readonly name: string; readonly positionId: string | null; readonly positionTitle: string | null;
  readonly isDefault: boolean; readonly isActive: boolean; readonly tasks: readonly TemplateTask[];
}
export interface TemplateFormData { name: string; positionId: string | null; isDefault: boolean; tasks: TemplateTask[] }

export interface IOnboardingRepository {
  listChecklists(): Promise<OnboardingChecklist[]>;
  getStatus(employeeId: string): Promise<OnboardingStatus | null>;
  completeTask(taskId: string, signature: string | null, documentUrl: string | null): Promise<OnbResult>;
  skipTask(taskId: string): Promise<OnbResult>;
  createChecklist(employeeId: string, templateId: string | null): Promise<OnbResult>;
  listTemplates(): Promise<OnboardingTemplate[]>;
  createTemplate(d: TemplateFormData): Promise<OnbResult>;
  updateTemplate(id: string, d: TemplateFormData): Promise<OnbResult>;
  uploadTaskDoc(tenantId: string, employeeId: string, taskId: string, file: File): Promise<string | null>;
  signDoc(path: string): Promise<string | null>;
}
