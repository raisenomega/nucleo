import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";
import { AppLayout } from "@shared/components/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

// Guard de layout: verifica sesión (DI del adapter) y monta el AppLayout profesional.
function AuthenticatedLayout() {
  const { session, isLoading, signOut } = useAuth(supabaseAuthAdapter);
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground font-body">Cargando…</p>
      </main>
    );
  }
  if (!session) return <Navigate to="/login" />;
  const onLogout = async () => {
    await signOut();
    void navigate({ to: "/login" });
  };
  return <AppLayout session={session} onLogout={onLogout} />;
}
