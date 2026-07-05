import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";

export const Route = createFileRoute("/registro")({
  component: Registro,
});

function Registro() {
  const [form, setForm] = useState({ name: "", email: "", password: "", business_name: "", phone: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const signUp = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (signUp.error) return void (setBusy(false), setError(signUp.error.message));
    const { data, error: rpcError } = await supabase.rpc("create_trial_tenant", {
      name: form.name, email: form.email, business_name: form.business_name, phone: form.phone,
    });
    setBusy(false);
    if (rpcError || (data && typeof data === "object" && "error" in data)) {
      return void setError(rpcError?.message ?? "No se pudo crear la prueba");
    }
    setDone(true);
  }

  const field = "w-full rounded-lg bg-secondary text-foreground p-3 font-body";
  if (done) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="font-display text-2xl font-bold text-primary">¡Cuenta creada!</h1>
          <p className="font-body text-muted-foreground">
            Revisa tu correo para confirmar tu email. Después podrás iniciar sesión.
          </p>
          <Link to="/login" className="inline-block text-primary font-body font-bold">Ir a iniciar sesión</Link>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="font-display text-3xl font-bold text-primary text-center">Prueba NÚCLEO gratis</h1>
        <input value={form.name} onChange={set("name")} placeholder="tu nombre" autoComplete="name" className={field} />
        <input type="email" value={form.email} onChange={set("email")} placeholder="correo" autoComplete="email" className={field} />
        <input type="password" value={form.password} onChange={set("password")} placeholder="contraseña" autoComplete="new-password" className={field} />
        <input value={form.business_name} onChange={set("business_name")} placeholder="nombre del negocio" className={field} />
        <input value={form.phone} onChange={set("phone")} placeholder="teléfono" autoComplete="tel" className={field} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground p-3 font-body font-bold disabled:opacity-50">
          {busy ? "Creando tu prueba…" : "Empezar 3 días gratis"}
        </button>
        <p className="text-sm text-muted-foreground text-center">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary">Inicia sesión</Link>
        </p>
      </form>
    </main>
  );
}
