import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { listNotifications, markNotifRead, markAllNotifRead } from "@shared/notifications/notifications.repository";
import { notifIcon, relativeTime } from "@shared/notifications/notif-format";
import { portalNotifRoute } from "@shared/portal/portal-notif-route";
import type { AppNotification } from "@shared/notifications/notification.types";

export const Route = createFileRoute("/portal/_app/notifications")({ component: PortalNotifs });

function PortalNotifs() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<AppNotification[]>([]);
  const load = useCallback(async () => setItems(await listNotifications(50)), []);
  useEffect(() => { void load(); }, [load]);
  const open = (n: AppNotification) => { void markNotifRead(n.id); window.location.assign(portalNotifRoute(n.entityType)); };
  const unread = items.filter((n) => !n.readAt).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">{t("navNotifications")}</h1>
        {unread > 0 && <button type="button" onClick={() => void markAllNotifRead().then(load)} className="text-sm font-bold text-primary">{t("markAllRead")}</button>}
      </div>
      {items.length === 0 && <p className="text-sm text-muted-foreground">{t("noNotifications")}</p>}
      {items.map((n) => { const Icon = notifIcon(n.entityType); return (
        <button key={n.id} type="button" onClick={() => open(n)} className={`flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left ${n.readAt ? "bg-card" : "bg-primary/5"}`}>
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className={`block ${n.readAt ? "" : "font-bold"}`}>{n.title}</span>
            {n.body && <span className="block truncate text-sm text-muted-foreground">{n.body}</span>}
            <span className="text-xs text-muted-foreground">{relativeTime(n.createdAt, locale)}</span>
          </span>
        </button>); })}
    </div>
  );
}
