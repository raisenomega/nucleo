import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SessionProvider, useSession } from "@shared/providers/SessionProvider";
import { ModuleAccessProvider } from "@shared/providers/ModuleAccessProvider";
import { BrandProvider } from "@shared/providers/BrandProvider";
import { AppLayout } from "@shared/components/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedRoute,
});

// SessionProvider envuelve toda la app autenticada; el Guard lee la sesión de useSession().
function AuthenticatedRoute() {
  return (
    <SessionProvider>
      <Guard />
    </SessionProvider>
  );
}

function Guard() {
  const { session, isLoading } = useSession();
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground font-body">Cargando…</p>
      </main>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return (
    <BrandProvider>
      <ModuleAccessProvider>
        <AppLayout />
      </ModuleAccessProvider>
    </BrandProvider>
  );
}
