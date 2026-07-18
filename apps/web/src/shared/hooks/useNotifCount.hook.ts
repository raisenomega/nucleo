import { useCallback, useEffect, useState } from "react";
import { unreadNotifCount } from "@shared/notifications/notifications.repository";

// Badge del sidebar: cuenta de notificaciones no leídas del usuario. Polling 30s. RLS por user_id.
export function useNotifCount(dep?: string) {
  const [count, setCount] = useState(0);
  const load = useCallback(async () => { setCount(await unreadNotifCount()); }, []);
  useEffect(() => { void load(); const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load, dep]);
  return { count, refresh: load };
}
