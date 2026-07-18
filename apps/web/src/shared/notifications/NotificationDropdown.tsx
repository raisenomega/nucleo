import { useI18n } from "@shared/i18n";
import { notifRoute } from "@shared/notifications/notif-format";
import { NotificationItem } from "@shared/notifications/NotificationItem";
import type { useNotifications } from "@shared/notifications/useNotifications.hook";
import type { AppNotification } from "@shared/notifications/notification.types";

// Panel bajo la campanita: header + lista (últimas 20) + "Ver todas". Full-width en mobile.
export function NotificationDropdown({ n, onClose }: { n: ReturnType<typeof useNotifications>; onClose: () => void }) {
  const { t } = useI18n();
  const open = (notif: AppNotification) => { void n.markRead(notif.id); onClose(); window.location.assign(notifRoute(notif.entityType, notif.entityId)); };
  return (
    <div className="absolute right-0 z-50 mt-2 flex max-h-[70vh] w-[92vw] max-w-sm flex-col rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-bold">{t("notifications")}</span>
        {n.unread > 0 && <button type="button" onClick={() => void n.markAll()} className="text-xs font-bold text-primary">{t("markAllRead")}</button>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {n.items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{t("noNotifications")}</p>}
        {n.items.map((notif) => <NotificationItem key={notif.id} n={notif} onOpen={open} onDismiss={n.dismiss} />)}
      </div>
      <a href="/notifications" className="border-t border-border p-3 text-center text-sm font-bold text-primary">{t("viewAll")}</a>
    </div>
  );
}
