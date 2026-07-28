import { supabase } from "@shared/lib/supabase";
import type { AuthResult, IAuthPort, Session } from "@identity/domain/auth.types";

// Decodifica los claims del JWT (tenant_id/role los inyecta el custom_access_token_hook).
function toSession(userId: string, email: string, accessToken: string): Session {
  const payload = accessToken.split(".")[1] ?? "";
  const claims = JSON.parse(atob(payload)) as Record<string, unknown>;
  return {
    userId,
    email,
    tenantId: typeof claims.tenant_id === "string" ? claims.tenant_id : null,
    role: typeof claims.user_role === "string" ? claims.user_role : null,
  };
}

export const supabaseAuthAdapter: IAuthPort = {
  async signIn(email, password): Promise<AuthResult> {
    // GUARDIAN (S2): pre-gate por IP en watchlist (fail-open: si el RPC falla, se ignora).
    try {
      const { data: ipAllowed } = await supabase.rpc("check_ip_allowed");
      if (ipAllowed === false) {
        return { ok: false, error: { code: "too_many_attempts", message: "Acceso temporalmente bloqueado por actividad sospechosa. Intenta más tarde." } };
      }
    } catch {
      /* fail-open */
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      // GUARDIAN (S2): registra el fallo y aplica fuerza bruta / watchlist. RPC anon.
      try {
        const { data: brute } = await supabase.rpc("log_login_failed", { p_email: email });
        if (brute && (brute as { blocked?: boolean }).blocked) {
          return { ok: false, error: { code: "too_many_attempts", message: "Demasiados intentos fallidos. Cuenta protegida temporalmente." } };
        }
      } catch {
        /* telemetría best-effort */
      }
      return { ok: false, error: { code: "invalid_credentials", message: error?.message ?? "sin sesión" } };
    }
    const s = data.session;
    // GUARDIAN (S2): registra el login y detecta IP/dispositivo nuevo (fire-and-forget).
    void supabase.rpc("log_login_success");
    return { ok: true, value: toSession(s.user.id, s.user.email ?? email, s.access_token) };
  },
  async signOut() {
    // GUARDIAN (S2): registra el logout ANTES de cerrar sesión (necesita auth.uid()).
    try {
      await supabase.rpc("log_logout");
    } catch {
      /* best-effort */
    }
    await supabase.auth.signOut();
  },
  async getSession() {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    return s ? toSession(s.user.id, s.user.email ?? "", s.access_token) : null;
  },
  onAuthStateChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      cb(session ? toSession(session.user.id, session.user.email ?? "", session.access_token) : null),
    );
    return () => data.subscription.unsubscribe();
  },
};
