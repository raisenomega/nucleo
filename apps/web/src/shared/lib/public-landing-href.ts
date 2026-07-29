// URL de la landing PÚBLICA del tenant, para el botón "Volver al inicio" de las páginas públicas.
// Las páginas de éxito se sirven a veces en el subdominio del PANEL (app.{dominio}, = portal de empleados),
// donde "/" redirige a /login (hostKind='panel'), no a la landing. La landing pública del cliente vive en el
// subdominio público (www.{dominio}). Por eso mapeamos `app.` → `www.` para ir SIEMPRE a la landing pública.
// Si el host ya es público (www./apex/otro), se deja igual. Fallback "/" solo por defensa en SSR (los botones
// de las páginas públicas montan en cliente, así que window siempre existe aquí).
export function publicLandingHref(): string {
  if (typeof window === "undefined") return "/";
  const host = window.location.host.replace(/^app\./i, "www.");
  return `${window.location.protocol}//${host}/`;
}
