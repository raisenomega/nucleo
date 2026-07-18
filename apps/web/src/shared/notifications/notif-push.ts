// Push in-app vía Service Worker (sin server push): showNotification cuando llega una no-leída nueva.
export async function ensureNotifPermission(): Promise<void> {
  try { if (typeof Notification !== "undefined" && Notification.permission === "default") await Notification.requestPermission(); } catch { /* denegado */ }
}

export async function pushNotif(title: string, body: string, url: string): Promise<void> {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, { body, tag: url, data: { url }, icon: "/favicon.ico" });
  } catch { /* SW/permiso no disponible */ }
}
