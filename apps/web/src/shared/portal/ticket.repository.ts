import { supabase } from "@shared/lib/supabase";
import type { CustomerTicket, TicketMessage } from "@shared/portal/ticket.types";

type Row = Record<string, unknown>;
export async function listTickets(tenantId: string): Promise<CustomerTicket[]> {
  const { data } = await supabase.from("support_tickets").select("id, subject, description, status, priority, created_at").eq("tenant_id", tenantId).order("created_at", { ascending: false });
  return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, subject: (r.subject as string) ?? "", description: (r.description as string) ?? "", status: (r.status as string) ?? "", priority: (r.priority as string) ?? "", createdAt: (r.created_at as string) ?? "" }));
}
export async function listMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data } = await supabase.from("support_comments").select("id, content, author_id, created_at").eq("ticket_id", ticketId).order("created_at");
  return ((data as Row[] | null) ?? []).map((r) => ({ id: r.id as string, content: (r.content as string) ?? "", authorId: (r.author_id as string) ?? "", createdAt: (r.created_at as string) ?? "" }));
}
async function rpcOk(fn: string, args: object): Promise<boolean> { const { error } = await supabase.rpc(fn, args); return !error; }
export const createTicket = (tenantId: string, subject: string, description: string, priority: string) => rpcOk("customer_create_ticket", { p_tenant_id: tenantId, p_subject: subject, p_description: description, p_priority: priority });
export const replyTicket = (ticketId: string, content: string) => rpcOk("customer_reply_ticket", { p_ticket_id: ticketId, p_content: content });
