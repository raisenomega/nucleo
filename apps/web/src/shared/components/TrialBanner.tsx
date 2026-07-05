import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";
import type { Session } from "@identity/domain/auth.types";

type TrialInfo = { status: string; expires_at: string | null };

export function TrialBanner({ session }: { session: Session | null }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [info, setInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    // Confirma que el client tiene sesión válida (refresca si expiró) ANTES de consultar.
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) return; // sin sesión en el client → sin query (evita el 401)
      void supabase.from("tenants").select("status, expires_at").maybeSingle()
        .then(({ data, error }) => setInfo(error ? null : (data as TrialInfo | null)));
    });
  }, [session]);

  if (!session || !info || info.status !== "trial" || !info.expires_at) return null;

  const msLeft = new Date(info.expires_at).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / 86_400_000);

  if (msLeft <= 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-primary">{t("trialEnded")}</h2>
          <p className="font-body text-muted-foreground">{t("trialEndedDesc")}</p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/agendar-consulta" })}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 font-body font-bold"
          >
            {t("scheduleConsultation")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-secondary text-foreground px-4 py-2 font-body text-sm text-center">
      {t("trialBanner", { days: daysLeft })}
    </div>
  );
}
