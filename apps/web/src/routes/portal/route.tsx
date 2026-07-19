import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SessionProvider } from "@shared/providers/SessionProvider";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";

export const Route = createFileRoute("/portal")({ component: PortalRoot });

// Layout raíz del portal: sesión (customer) + branding del tenant por hostname. Envuelve login/register y el área guardada.
function PortalRoot() {
  return (
    <SessionProvider>
      <PublicBrandProvider><Outlet /></PublicBrandProvider>
    </SessionProvider>
  );
}
