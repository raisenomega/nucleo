import { supabase } from "@shared/lib/supabase";

// Método de costeo del tenant. Vive en tenants.costing_method (RLS tenants_self_select permite leerlo).
export type CostingMethod = "weighted_avg" | "fifo";

export async function getCostingMethod(): Promise<CostingMethod> {
  const { data } = await supabase.from("tenants").select("costing_method").limit(1);
  return ((data as { costing_method: CostingMethod }[] | null)?.[0]?.costing_method) ?? "weighted_avg";
}

// Cambio gateado por CEO en el backend (set_costing_method corre _migrate_to_fifo si pasa a fifo).
export async function setCostingMethodRpc(method: CostingMethod): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.rpc("set_costing_method", { p_method: method });
  return error ? { ok: false, error: error.message } : { ok: true };
}
