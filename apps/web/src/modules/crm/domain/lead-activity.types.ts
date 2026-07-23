// Ola 2.6b · actividades del lead (timeline + tareas/seguimientos).
export type ActivityKind = "call" | "email" | "note" | "task" | "meeting" | "whatsapp";

export interface LeadActivity {
  id: string; leadId: string; kind: ActivityKind; body: string;
  dueDate: string | null; doneAt: string | null; createdAt: string;
}

export interface PendingFollowup {
  activityId: string; leadId: string; contactName: string; body: string;
  dueDate: string; bucket: "overdue" | "today" | "week";
}
