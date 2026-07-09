import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@identity/application/useAuth.hook";
import { supabaseAuthAdapter } from "@identity/infrastructure/supabase-auth.adapter";
import { PasswordInput } from "@shared/components/PasswordInput";

export const Route = createFileRoute("/login")({
  component: Login,
});

// Composition root: aquí se cablea el adapter concreto en el hook (DI).
function Login() {
  const { signIn } = useAuth(supabaseAuthAdapter);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) void navigate({ to: "/dashboard" });
    else setError(result.error.message);
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-3xl font-bold text-primary text-center">Núcleo</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="correo"
          autoComplete="email"
          className="w-full rounded-lg bg-secondary text-foreground p-3 font-body"
        />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="contraseña"
          autoComplete="current-password"
          className="w-full rounded-lg bg-secondary text-foreground p-3 font-body"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-primary text-primary-foreground p-3 font-body font-bold disabled:opacity-50"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-sm text-muted-foreground text-center">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-primary">Prueba gratis por 7 días</Link>
        </p>
        <p className="text-sm text-muted-foreground text-center">
          ¿Te invitaron? <Link to="/invite" className="text-primary">Crea tu cuenta</Link>
        </p>
      </form>
    </main>
  );
}
