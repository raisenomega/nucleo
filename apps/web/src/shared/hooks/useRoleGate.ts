import { useSession } from "@shared/providers/SessionProvider";

// Jerarquía de roles (app_role). Mayor número = más permisos.
const RANK: Record<string, number> = { servicio: 1, operaciones: 2, coo: 3, ceo: 4, superadmin: 5 };

// Gating por rol reutilizable: canEdit("coo") → true si el rol de sesión es coo o superior.
export function useRoleGate() {
  const { session } = useSession();
  const rank = RANK[session?.role ?? ""] ?? 0;
  return {
    role: session?.role ?? null,
    canEdit: (minRole: string) => rank >= (RANK[minRole] ?? 99),
  };
}
