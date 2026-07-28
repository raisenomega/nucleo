import { useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@shared/lib/supabase";
import { MfaChallenge } from "@identity/presentation/MfaChallenge";

// Gate de MFA: si el usuario tiene un factor verificado pero la sesión está en AAL1,
// bloquea con el challenge. Fail-open: ante error o mientras carga, deja pasar.
export function MfaGate({ children }: { children: ReactNode }) {
  const [need, setNeed] = useState<boolean | null>(null);

  const check = useCallback(() => {
    supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      .then(({ data }) => setNeed(!!data && data.currentLevel === "aal1" && data.nextLevel === "aal2"))
      .catch(() => setNeed(false));
  }, []);
  useEffect(() => { check(); }, [check]);

  if (need) return <MfaChallenge onVerified={check} />;
  return <>{children}</>;
}
