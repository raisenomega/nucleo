import { supabase } from "@shared/lib/supabase";
import type {
  ISupportRepository, Ticket, TicketInput, TicketDetail, TicketStatus, Priority, SupportSummary, SupResult,
} from "@hr/domain/support.types";

interface Row {
  id: string; subject: string; description: string | null; category_id: string | null; priority: string; status: string;
  created_by: string; assigned_to: string | null; created_at: string;
  categories: { label: string } | null; profiles: { full_name: string } | null;
}
const SEL = "id,subject,description,category_id,priority,status,created_by,assigned_to,created_at,categories:category_id(label),profiles:assigned_to(full_name)";
const ok = (e: { message: string } | null): SupResult => (e ? { ok: false, error: e.message } : { ok: true });
const toTicket = (r: Row): Ticket => ({
  id: r.id, subject: r.subject, description: r.description, categoryId: r.category_id, categoryLabel: r.categories?.label ?? null,
  priority: r.priority as Priority, status: r.status as TicketStatus, createdBy: r.created_by,
  assignedTo: r.assigned_to, assignedName: r.profiles?.full_name ?? null, createdAt: r.created_at,
});

export const supabaseSupportRepository: ISupportRepository = {
  async list(): Promise<Ticket[]> {
    const { data } = await supabase.from("support_tickets").select(SEL).order("created_at", { ascending: false });
    return ((data as unknown as Row[] | null) ?? []).map(toTicket);
  },
  async detail(id): Promise<TicketDetail | null> {
    const { data } = await supabase.from("support_tickets").select(SEL).eq("id", id).single();
    if (!data) return null;
    const { data: cs } = await supabase.from("support_comments").select("id,author_id,content,evidence_urls,created_at").eq("ticket_id", id).order("created_at");
    const comments = ((cs as { id: string; author_id: string; content: string; evidence_urls: string[] | null; created_at: string }[] | null) ?? [])
      .map((c) => ({ id: c.id, authorId: c.author_id, content: c.content, evidenceUrls: c.evidence_urls ?? [], createdAt: c.created_at }));
    return { ...toTicket(data as unknown as Row), comments };
  },
  async create(t: TicketInput): Promise<SupResult> {
    return ok((await supabase.from("support_tickets").insert({
      subject: t.subject, description: t.description || null, category_id: t.categoryId || null, priority: t.priority,
    })).error);
  },
  async setStatus(id, status: TicketStatus): Promise<SupResult> {
    return ok((await supabase.from("support_tickets").update({
      status, resolved_at: status === "resolved" ? new Date().toISOString() : null,
    }).eq("id", id)).error);
  },
  async assign(id, assignedTo): Promise<SupResult> {
    return ok((await supabase.from("support_tickets").update({ assigned_to: assignedTo }).eq("id", id)).error);
  },
  async addComment(ticketId, content, evidence): Promise<SupResult> {
    return ok((await supabase.from("support_comments").insert({ ticket_id: ticketId, content, evidence_urls: evidence })).error);
  },
  async summary(): Promise<SupportSummary> {
    const { data } = await supabase.rpc("get_support_summary");
    return (data as SupportSummary | null) ?? { open: 0, in_progress: 0, resolved: 0, closed: 0 };
  },
};
