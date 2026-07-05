import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { session, signOut } = useAuth(supabaseAuthAdapter);
  const navigate = useNavigate();

  async function onLogout() {
    await signOut();
    void navigate({ to: "/login" });
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="font-display text-4xl font-bold text-primary">Bienvenido a NÚCLEO</h1>
        <p className="font-body text-lg">{session?.email ?? "—"}</p>
        <p className="font-body text-muted-foreground">Rol: {session?.role ?? "—"}</p>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body font-bold"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
