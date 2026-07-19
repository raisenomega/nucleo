import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { unreadNotifCount } from "@shared/notifications/notifications.repository";

// Campanita del portal: badge de no leídas (polling 30s) → link a la página de notificaciones.
export function PortalNotifBell() {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const load = useCallback(async () => setCount(await unreadNotifCount()), []);
  useEffect(() => { void load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);
  return (
    <Link to="/portal/notifications" aria-label={t("navNotifications")} className="relative rounded-lg p-2 hover:bg-secondary">
      <Bell className="h-5 w-5" />
      {count > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
