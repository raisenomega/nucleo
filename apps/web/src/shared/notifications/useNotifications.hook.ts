import { useCallback, useEffect, useRef, useState } from "react";
import { listNotifications, markNotifRead, markAllNotifRead, dismissNotif } from "@shared/notifications/notifications.repository";
import { notifRoute } from "@shared/notifications/notif-format";
import { ensureNotifPermission, pushNotif } from "@shared/notifications/notif-push";
import type { AppNotification } from "@shared/notifications/notification.types";

// Polling 30s. Dispara push cuando aparece una NO-leída nueva (solo si enablePush). Sin realtime.
export function useNotifications(limit = 20, enablePush = true) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const seen = useRef<string | null>(null);
  const load = useCallback(async () => {
    const list = await listNotifications(limit);
    setItems(list);
    const newest = list[0];
    if (enablePush && newest && seen.current !== null && newest.createdAt > seen.current && !newest.readAt) {
      void pushNotif(newest.title, newest.body, notifRoute(newest.entityType, newest.entityId));
    }
    if (newest) seen.current = newest.createdAt; else if (seen.current === null) seen.current = "";
  }, [limit, enablePush]);
  useEffect(() => { if (enablePush) void ensureNotifPermission(); }, [enablePush]);
  useEffect(() => { void load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);
  const markRead = useCallback(async (id: string) => { await markNotifRead(id); await load(); }, [load]);
  const markAll = useCallback(async () => { await markAllNotifRead(); await load(); }, [load]);
  const dismiss = useCallback(async (id: string) => { await dismissNotif(id); await load(); }, [load]);
  const unread = items.filter((n) => !n.readAt).length;
  return { items, unread, markRead, markAll, dismiss, refresh: load };
}
