import { useSession } from "@shared/providers/SessionProvider";

// El superadmin administra la PLATAFORMA NÚCLEO (no un negocio de servicio). Rol 'superadmin' del JWT (user_role).
export function useSuperAdmin() {
  const { session } = useSession();
  return { isSuperAdmin: session?.role === "superadmin" };
}
