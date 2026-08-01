import { supabase } from "@shared/lib/supabase";
import type { Result } from "@billing/domain/invoice.types";

// Suscripciones Stripe del tenant (Fase 2). Lectura tenant-scoped + cancelación (CEO) vía RPC definer.
export interface Subscription {
  id: string; customer: string | null; email: string | null; item: string | null; frequency: string | null;
  amount: number; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; createdAt: string;
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const { data } = await supabase.rpc("get_subscriptions");
  return (data as Subscription[]) ?? [];
}

// La RPC nunca lanza: devuelve {ok:true} o {error:<codigo>}, con `detail` textual de Stripe en stripe_rejected.
// Antes los 5 codigos colapsaban en `false` y nadie lo leia (auditoria E2E §13).
export type CancelCode = "not_found" | "forbidden" | "no_secret" | "stripe_unreachable" | "stripe_rejected" | "rpc";
export type CancelErr = { code: CancelCode; detail?: string };

export async function cancelSubscription(id: string): Promise<Result<null, CancelErr>> {
  const { data, error } = await supabase.rpc("cancel_subscription", { p_id: id });
  if (error) return { ok: false, error: { code: "rpc", detail: error.message } };
  const d = (data ?? {}) as { ok?: boolean; error?: string; detail?: string };
  if (d.ok === true) return { ok: true, value: null };
  return { ok: false, error: { code: (d.error as CancelCode) ?? "rpc", detail: d.detail } };
}
