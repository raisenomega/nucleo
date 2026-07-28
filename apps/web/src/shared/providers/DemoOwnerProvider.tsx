import { useCallback, useMemo, useState, type ReactNode } from "react";
import { DemoOwnerContext } from "@shared/providers/demo-owner-context";

const KEY = "demo_owner_until";

function readOwner(): boolean {
  if (typeof window === "undefined") return false;
  const until = Number(window.sessionStorage.getItem(KEY) ?? 0);
  return until > Date.now();
}

// Persiste el modo owner en sessionStorage (8h, igual que la sesión backend). Se pierde al cerrar la pestaña.
export function DemoOwnerProvider({ children }: { children: ReactNode }) {
  const [ownerMode, setOwnerMode] = useState<boolean>(readOwner);
  const enableOwnerMode = useCallback(() => {
    window.sessionStorage.setItem(KEY, String(Date.now() + 8 * 3600 * 1000));
    setOwnerMode(true);
  }, []);
  const disableOwnerMode = useCallback(() => {
    window.sessionStorage.removeItem(KEY);
    setOwnerMode(false);
  }, []);
  const value = useMemo(() => ({ ownerMode, enableOwnerMode, disableOwnerMode }), [ownerMode, enableOwnerMode, disableOwnerMode]);
  return <DemoOwnerContext.Provider value={value}>{children}</DemoOwnerContext.Provider>;
}
