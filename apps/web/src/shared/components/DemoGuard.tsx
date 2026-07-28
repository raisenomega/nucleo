import type { ReactNode } from "react";
import { useBrand } from "@shared/providers/brand-context";
import { useDemoOwner } from "@shared/providers/demo-owner-context";

// Envuelve UI destructiva. En tenant demo sin modo owner → muestra fallback (o nada).
// El bloqueo REAL es backend (trigger _demo_write_guard); esto es UX limpia.
export function DemoGuard({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { isDemoTenant } = useBrand();
  const { ownerMode } = useDemoOwner();
  if (isDemoTenant && !ownerMode) return <>{fallback}</>;
  return <>{children}</>;
}
