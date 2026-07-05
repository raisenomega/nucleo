import { useCallback, useEffect, useState } from "react";
import type { AuthResult, IAuthPort, Session } from "@identity/domain/auth.types";

// Recibe el puerto por inyección (DI) — NO importa infrastructure (A9 + oráculo #3).
export function useAuth(auth: IAuthPort) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void auth.getSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });
    return auth.onAuthStateChange(setSession);
  }, [auth]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const result = await auth.signIn(email, password);
      if (result.ok) setSession(result.value);
      return result;
    },
    [auth],
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    setSession(null);
  }, [auth]);

  return { session, isLoading, signIn, signOut };
}
