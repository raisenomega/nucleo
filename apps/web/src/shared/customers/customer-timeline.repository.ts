import { supabase } from "@shared/lib/supabase";

// Timeline de actividad del cliente (RPC get_customer_timeline, migr 281 — devuelve camelCase directo).
export interface TimelineEvent {
  eventDate: string; eventType: string; title: string; subtitle: string | null;
  entityType: string; entityId: string; actorName: string | null;
}

export async function getCustomerTimeline(customerId: string, limit: number, offset: number): Promise<TimelineEvent[]> {
  const { data } = await supabase.rpc("get_customer_timeline", { p_customer_id: customerId, p_limit: limit, p_offset: offset });
  return (data as TimelineEvent[] | null) ?? [];
}
