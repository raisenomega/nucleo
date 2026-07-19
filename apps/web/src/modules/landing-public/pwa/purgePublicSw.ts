// El portal/landing del tenant es WEB PURA (sin PWA/install). Este helper PURGA cualquier SW público que
// haya quedado registrado en visitas previas: lo desregistra y borra sus caches. Solo corre en el origen del
// tenant (zramos.com) — el SW del panel vive en app.* (otro origen) y no se toca. Reemplaza al registro.
export function purgePublicSw(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  void navigator.serviceWorker.getRegistrations().then((regs) => { for (const r of regs) void r.unregister(); });
  if (typeof caches !== "undefined") {
    void caches.keys().then((keys) => { for (const k of keys) if (k.startsWith("landing-public-")) void caches.delete(k); });
  }
}
