import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

// Guard de layout: verifica sesión vía el hook (DI del adapter).
function AuthenticatedLayout() {
  const { session, isLoading } = useAuth(supabaseAuthAdapter);
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground font-body">Cargando…</p>
      </main>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return <Outlet />;
}
