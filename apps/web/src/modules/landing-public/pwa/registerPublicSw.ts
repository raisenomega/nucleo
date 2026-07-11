// Registra el SW público (scope '/') en la landing del tenant. Skip localhost. Reemplaza el SW del panel si lo había.
export function registerPublicSw(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.location.hostname === "localhost") return;
  navigator.serviceWorker.register("/service-worker-public.js", { scope: "/" }).catch(() => {});
}
