// BC hr — soporte/tickets internos. Puro.
export type SupResult = { ok: true } | { ok: false; error: string };
export type Priority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface Ticket {
  readonly id: string; readonly subject: string; readonly description: string | null;
  readonly categoryId: string | null; readonly categoryLabel: string | null;
  readonly priority: Priority; readonly status: TicketStatus;
  readonly createdBy: string; readonly assignedTo: string | null; readonly assignedName: string | null; readonly createdAt: string;
}
export interface TicketInput { subject: string; description: string; categoryId: string; priority: Priority; }
export interface TicketComment {
  readonly id: string; readonly authorId: string; readonly content: string;
  readonly evidenceUrls: string[]; readonly createdAt: string;
}
export interface TicketDetail extends Ticket { readonly comments: readonly TicketComment[]; }
export interface SupportSummary { readonly open: number; readonly in_progress: number; readonly resolved: number; readonly closed: number; }

export interface ISupportRepository {
  list(): Promise<Ticket[]>;
  detail(id: string): Promise<TicketDetail | null>;
  create(t: TicketInput): Promise<SupResult>;
  setStatus(id: string, status: TicketStatus): Promise<SupResult>;
  assign(id: string, assignedTo: string | null): Promise<SupResult>;
  addComment(ticketId: string, content: string, evidence: string[]): Promise<SupResult>;
  summary(): Promise<SupportSummary>;
}
