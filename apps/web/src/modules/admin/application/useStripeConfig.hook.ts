import { useCallback, useEffect, useState } from "react";
import { supabase } from "@shared/lib/supabase";

export interface StripeConfig {
  configured: boolean; stripeEnabled?: boolean; publishableKey?: string | null; accountId?: string | null;
  testMode?: boolean; lastValidatedAt?: string | null; validationError?: string | null;
  hasSecret?: boolean; hasWebhook?: boolean; catalogSyncStatus?: string | null;
}
type SaveRes = { saved?: boolean; error?: string } | null;
type ValRes = { valid?: boolean; error?: string; account_id?: string } | null;

// Config de Stripe del tenant (STRIPE-1). Todo vía RPCs definer (get/save/validate); el secret nunca sale.
export function useStripeConfig() {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc("get_stripe_config");
    setConfig((data ?? { configured: false }) as StripeConfig);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (pk: string, sk: string, wh: string): Promise<string | null> => {
    setBusy(true);
    const { data, error } = await supabase.rpc("save_stripe_credentials", { p_publishable_key: pk, p_secret_key: sk, p_webhook_secret: wh || null });
    setBusy(false);
    const r = data as SaveRes;
    if (error || !r?.saved) return r?.error ?? error?.message ?? "Error";
    await refresh();
    return null;
  }, [refresh]);

  const validate = useCallback(async (): Promise<ValRes> => {
    setBusy(true);
    const { data } = await supabase.rpc("validate_stripe_credentials");
    setBusy(false);
    await refresh();
    return data as ValRes;
  }, [refresh]);

  return { config, busy, save, validate };
}
