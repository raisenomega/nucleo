import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";

export const Route = createFileRoute("/pin")({
  component: Pin,
});

function Pin() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("verify_my_pin", { pin });
    setBusy(false);
    if (!rpcError && data === true) void navigate({ to: "/dashboard" });
    else setError("PIN incorrecto");
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-xs space-y-4 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">PIN de acceso</h1>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          className="w-full rounded-lg bg-secondary text-foreground p-3 text-center text-2xl tracking-widest font-body"
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={busy || pin.length !== 4}
          className="w-full rounded-lg bg-primary text-primary-foreground p-3 font-body font-bold disabled:opacity-50"
        >
          {busy ? "Verificando…" : "Verificar"}
        </button>
      </form>
    </main>
  );
}
