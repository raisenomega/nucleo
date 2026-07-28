import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { supabase } from "@shared/lib/supabase";

// Recordatorio para el superadmin sin MFA. Se muestra en el panel de seguridad.
export function MfaBanner() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    void supabase.auth.mfa.listFactors()
      .then(({ data }) => setShow(!data?.totp?.some((f) => f.status === "verified")))
      .catch(() => setShow(false));
  }, []);
  if (!show) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3 text-sm">
      <span className="text-orange-600">⚠️ {t("mfaBannerText")}</span>
      <Link to="/settings" className="ml-auto font-bold text-accent">{t("mfaBannerCta")} →</Link>
    </div>
  );
}
