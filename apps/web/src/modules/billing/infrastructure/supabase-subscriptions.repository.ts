import { supabase } from "@shared/lib/supabase";

// Suscripciones Stripe del tenant (Fase 2). Lectura tenant-scoped + cancelación (CEO) vía RPC definer.
export interface Subscription {
  id: string; customer: string | null; email: string | null; item: string | null; frequency: string | null;
  amount: number; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; createdAt: string;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data } = await supabase.rpc("get_subscriptions");
  return (data as Subscription[]) ?? [];
}

export async function cancelSubscription(id: string): Promise<boolean> {
  const { data } = await supabase.rpc("cancel_subscription", { p_id: id });
  return (data as { ok?: boolean } | null)?.ok === true;
}
