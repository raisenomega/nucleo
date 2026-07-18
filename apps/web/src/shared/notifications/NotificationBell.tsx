import { useState } from "react";
import { Bell } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { useNotifications } from "@shared/notifications/useNotifications.hook";
import { NotificationDropdown } from "@shared/notifications/NotificationDropdown";

// Campanita global del header: badge rojo con no-leídas + dropdown. Único origen de push (poll 30s).
export function NotificationBell() {
  const { t } = useI18n();
  const n = useNotifications();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={t("notifications")} className="relative rounded-lg p-2 hover:bg-secondary">
        <Bell className="h-5 w-5" />
        {n.unread > 0 && <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{n.unread > 99 ? "99+" : n.unread}</span>}
      </button>
      {open && <>
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
        <NotificationDropdown n={n} onClose={() => setOpen(false)} />
      </>}
    </div>
  );
}
