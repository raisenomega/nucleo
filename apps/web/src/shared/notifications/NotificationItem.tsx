import { X } from "lucide-react";
import { useI18n } from "@shared/i18n";
import { notifIcon, relativeTime } from "@shared/notifications/notif-format";
import type { AppNotification } from "@shared/notifications/notification.types";

// Fila de notificación (dropdown + página). Negrita + punto azul si no leída. Click → abre; X → dismiss.
export function NotificationItem({ n, onOpen, onDismiss }: {
  n: AppNotification; onOpen: (n: AppNotification) => void; onDismiss?: (id: string) => void;
}) {
  const { t, locale } = useI18n();
  const Icon = notifIcon(n.entityType);
  const unread = !n.readAt;
  return (
    <div className={`flex items-start gap-2 border-b border-border p-3 ${unread ? "bg-primary/5" : ""}`}>
      <button type="button" onClick={() => onOpen(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className={`block truncate ${unread ? "font-bold" : "font-medium"}`}>{n.title}</span>
          {n.body && <span className="block truncate text-sm text-muted-foreground">{n.body}</span>}
          <span className="text-xs text-muted-foreground">{relativeTime(n.createdAt, locale)}</span>
        </span>
        {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
      </button>
      {onDismiss && <button type="button" onClick={() => onDismiss(n.id)} aria-label={t("delete")} className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>}
    </div>
  );
}
