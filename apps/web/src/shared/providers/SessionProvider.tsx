import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";
import type { Session } from "@identity/domain/auth.types";

type SessionValue = { session: Session | null; isLoading: boolean; signOut: () => Promise<void> };

const SessionContext = createContext<SessionValue | null>(null);

// Composition root de la sesión: llama useAuth (getSession + onAuthStateChange) UNA sola vez.
export function SessionProvider({ children }: { children: ReactNode }) {
  const { session, isLoading, signOut } = useAuth(supabaseAuthAdapter);
  return (
    <SessionContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de SessionProvider");
  return ctx;
}
