import { supabase } from "@shared/lib/supabase";
import type {
  IOnboardingRepository, OnboardingChecklist, OnboardingStatus, OnboardingTask, OnboardingTemplate, TemplateTask, TemplateFormData, OnbResult,
} from "@hr/domain/onboarding.types";

const ok = (e: { message: string } | null): OnbResult => (e ? { ok: false, error: e.message } : { ok: true });
const r2 = (r: Record<string, unknown>): OnboardingChecklist => ({
  id: r.id as string, employeeId: r.employee_id as string, employeeName: (r.profiles as { full_name: string } | null)?.full_name ?? "—",
  positionTitle: (r.position_title as string) ?? null, status: r.status as OnboardingChecklist["status"],
  totalTasks: Number(r.total_tasks ?? 0), completedTasks: Number(r.completed_tasks ?? 0), startedAt: r.started_at as string,
});
const toTask = (t: Record<string, unknown>): OnboardingTask => ({
  id: t.id as string, title: t.title as string, description: (t.description as string) ?? null, category: t.category as OnboardingTask["category"],
  assignedTo: t.assigned_to as OnboardingTask["assignedTo"], taskOrder: Number(t.task_order ?? 0),
  requiresSignature: !!t.requires_signature, requiresDocument: !!t.requires_document, linkedTrainingId: (t.linked_training_id as string) ?? null,
  status: t.status as OnboardingTask["status"], completedAt: (t.completed_at as string) ?? null, dueDate: (t.due_date as string) ?? null, documentUrl: (t.document_url as string) ?? null,
});
const toTpl = (r: Record<string, unknown>): OnboardingTemplate => ({
  id: r.id as string, name: r.name as string, positionId: (r.position_id as string) ?? null,
  positionTitle: (r.job_positions as { title: string } | null)?.title ?? null, isDefault: !!r.is_default, isActive: !!r.is_active,
  tasks: (Array.isArray(r.tasks) ? r.tasks : []).map((t: Record<string, unknown>): TemplateTask => ({
    id: (t.id as string) ?? "", title: (t.title as string) ?? "", description: (t.description as string) ?? "", category: (t.category as TemplateTask["category"]) ?? "other",
    assignedTo: (t.assigned_to as TemplateTask["assignedTo"]) ?? "employee", requiresSignature: !!t.requires_signature, requiresDocument: !!t.requires_document,
    dueDays: Number(t.due_days ?? 7), order: Number(t.order ?? 0) })),
});
const tplData = (d: TemplateFormData) => ({ name: d.name, position_id: d.positionId, is_default: d.isDefault,
  tasks: d.tasks.map((t) => ({ id: t.id, title: t.title, description: t.description, category: t.category, assigned_to: t.assignedTo,
    requires_signature: t.requiresSignature, requires_document: t.requiresDocument, due_days: t.dueDays, order: t.order })) });

export const supabaseOnboardingRepository: IOnboardingRepository = {
  async listChecklists() {
    const { data } = await supabase.from("onboarding_checklists").select("id,employee_id,position_title,status,total_tasks,completed_tasks,started_at,profiles:employee_id(full_name)").order("started_at", { ascending: false });
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map(r2);
  },
  async getStatus(employeeId): Promise<OnboardingStatus | null> {
    const { data } = await supabase.rpc("get_onboarding_status", { p_employee_id: employeeId });
    const d = data as { checklist: Record<string, unknown>; tasks: Record<string, unknown>[] } | null;
    return d?.checklist ? { checklist: r2(d.checklist), tasks: (d.tasks ?? []).map(toTask) } : null;
  },
  async completeTask(taskId, signature, documentUrl) { return ok((await supabase.rpc("complete_onboarding_task", { p_task_id: taskId, p_signature_data: signature, p_document_url: documentUrl })).error); },
  async skipTask(taskId) { return ok((await supabase.rpc("skip_onboarding_task", { p_task_id: taskId })).error); },
  async createChecklist(employeeId, templateId) { return ok((await supabase.rpc("create_onboarding_checklist", { p_employee_id: employeeId, p_template_id: templateId })).error); },
  async listTemplates() {
    const { data } = await supabase.from("onboarding_templates").select("id,name,position_id,is_default,is_active,tasks,job_positions:position_id(title)").eq("is_active", true).order("is_default", { ascending: false });
    return ((data as unknown as Record<string, unknown>[] | null) ?? []).map(toTpl);
  },
  async createTemplate(d) { return ok((await supabase.rpc("create_onboarding_template", { p_data: tplData(d) })).error); },
  async updateTemplate(id, d) { return ok((await supabase.rpc("update_onboarding_template", { p_id: id, p_data: tplData(d) })).error); },
  async uploadTaskDoc(tenantId, employeeId, taskId, file: File): Promise<string | null> {
    const path = `${tenantId}/${employeeId}/onb-${taskId}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("employee-docs").upload(path, file, { upsert: true });
    return error ? null : path;
  },
  async signDoc(path): Promise<string | null> {
    const { data } = await supabase.storage.from("employee-docs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  },
};
