import { supabase } from "@shared/lib/supabase";
import type { AppNotification } from "@shared/notifications/notification.types";

type Row = Record<string, unknown>;
const SEL = "id, kind, title, body, entity_type, entity_id, read_at, created_at";
const toNotif = (r: Row): AppNotification => ({
  id: r.id as string, kind: (r.kind as string) ?? "", title: (r.title as string) ?? "", body: (r.body as string) ?? "",
  entityType: (r.entity_type as string) ?? "", entityId: (r.entity_id as string) ?? null,
  readAt: (r.read_at as string) ?? null, createdAt: (r.created_at as string) ?? "",
});

// RLS scopea todo por user_id = auth.uid(); no hace falta filtrar en el cliente.
export async function listNotifications(limit: number): Promise<AppNotification[]> {
  const { data } = await supabase.from("notifications").select(SEL).order("created_at", { ascending: false }).limit(limit);
  return ((data as Row[] | null) ?? []).map(toNotif);
}
export async function unreadNotifCount(): Promise<number> {
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  return count ?? 0;
}
export async function markNotifRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}
export async function markAllNotifRead(): Promise<void> {
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
}
export async function dismissNotif(id: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", id);
}
