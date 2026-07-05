import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";

type TrialInfo = { status: string; expires_at: string | null };

export function TrialBanner() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    void supabase.from("tenants").select("status, expires_at").single()
      .then(({ data }) => setInfo(data as TrialInfo | null));
  }, []);

  if (!info || info.status !== "trial" || !info.expires_at) return null;

  const msLeft = new Date(info.expires_at).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / 86_400_000);

  if (msLeft <= 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary">Tu prueba terminó</h2>
          <p className="font-body text-muted-foreground">Agenda una consulta para seguir con NÚCLEO.</p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/agendar-consulta" })}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 font-body font-bold"
          >
            Agendar consulta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body text-sm text-center">
      Te quedan <span className="font-bold text-primary">{daysLeft}</span>{" "}
      {daysLeft === 1 ? "día" : "días"} de prueba
    </div>
  );
}
