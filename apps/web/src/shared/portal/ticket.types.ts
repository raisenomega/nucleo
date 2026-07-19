// Portal P4 — tickets de soporte del cliente (reusa support_tickets + support_comments).
export interface CustomerTicket {
  readonly id: string; readonly subject: string; readonly description: string;
  readonly status: string; readonly priority: string; readonly createdAt: string;
}
export interface TicketMessage { readonly id: string; readonly content: string; readonly authorId: string; readonly createdAt: string }
