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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return { ok: false, error: { code: "invalid_credentials", message: error?.message ?? "sin sesión" } };
    }
    const s = data.session;
    return { ok: true, value: toSession(s.user.id, s.user.email ?? email, s.access_token) };
  },
  async signOut() {
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
