import { useEffect } from "react";
import { useI18n } from "@shared/i18n";
import { useToast } from "@shared/providers/toast-context";
import { syncOfflineBuffer } from "@shared/gps/gps.repository";

// Reintenta el buffer GPS offline al recuperar conexión o al reenfocar la app. Read-only, NO toca el tracking.
export function GpsResilience() {
  const { t } = useI18n();
  const toast = useToast();
  useEffect(() => {
    const sync = () => void syncOfflineBuffer().then((n) => { if (n > 0) toast.success(`${t("gpsSynced")}: ${n}`); });
    const onVis = () => { if (document.visibilityState === "visible") sync(); };
    window.addEventListener("online", sync);
    document.addEventListener("visibilitychange", onVis);
    sync();
    return () => { window.removeEventListener("online", sync); document.removeEventListener("visibilitychange", onVis); };
  }, [t, toast]);
  return null;
}
