import { supabase } from "@shared/lib/supabase";

// Acceso al SSN cifrado SOLO por RPC (la tabla employee_ssn es deny-all para el cliente; el bytea nunca cruza
// la red). Errores de las RPCs (NOT_AUTHORIZED, INVALID_SSN_FORMAT…) llegan como error.message.
type R = { ok: true } | { ok: false; error: string };

export const ssnRepository = {
  // Máscara por defecto: '•••-••-1234' o null si no hay SSN registrado.
  async last4(profileId: string): Promise<string | null> {
    const { data } = await supabase.rpc("get_employee_ssn_last4", { p_profile_id: profileId });
    return (data as string | null) ?? null;
  },
  // Completo bajo demanda (queda auditado en el servidor como reveal_ssn).
  async reveal(profileId: string): Promise<string | null> {
    const { data } = await supabase.rpc("get_employee_ssn", { p_profile_id: profileId });
    return ((data as { ssn?: string | null } | null)?.ssn) ?? null;
  },
  async save(profileId: string, ssn: string): Promise<R> {
    const { error } = await supabase.rpc("set_employee_ssn", { p_profile_id: profileId, p_ssn: ssn });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
