import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";
import { isRaisenHost } from "@shared/lib/brand-host";
import { useRaisenGuard } from "@shared/hooks/useRaisenGuard";
import { useMounted } from "@shared/hooks/useMounted";

export const Route = createFileRoute("/agendar-consulta")({
  component: AgendarConsulta,
});

function AgendarConsulta() {
  const [form, setForm] = useState({ business_type: "", employee_count: "", main_problem: "", desired_start: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useRaisenGuard();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />; // SSR/1er render: placeholder neutro
  if (!isRaisenHost()) return null; // D2: producto Raisen solo en dominios operacionales

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("submit_consultation", form);
    setBusy(false);
    if (rpcError) setError(rpcError.message);
    else setSent(true);
  }

  const field = "w-full rounded-lg bg-secondary text-foreground p-3 font-body";
  if (sent) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <p className="max-w-md text-center font-body text-lg text-primary">
          Gracias, un representante de NÚCLEO le contactará.
        </p>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="font-display text-2xl font-bold text-primary text-center">Agenda una consulta</h1>
        <input value={form.business_type} onChange={set("business_type")} placeholder="tipo de negocio" className={field} />
        <input value={form.employee_count} onChange={set("employee_count")} placeholder="cuántos empleados" className={field} />
        <textarea value={form.main_problem} onChange={set("main_problem")} placeholder="problema principal" rows={3} className={field} />
        <input value={form.desired_start} onChange={set("desired_start")} placeholder="cuándo quieres empezar" className={field} />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-primary text-primary-foreground p-3 font-body font-bold disabled:opacity-50">
          {busy ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </main>
  );
}
