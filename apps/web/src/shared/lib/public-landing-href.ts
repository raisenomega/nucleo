// URL de la landing PÚBLICA del tenant, para el botón "Volver al inicio" de las páginas públicas.
// Si la página se sirve en el panel (app.{dominio}), quita el prefijo `app.`: en ese host, "/" redirige
// a /login (hostKind='panel'), no a la landing. En el host público del tenant devuelve la raíz absoluta.
// Las páginas públicas solo montan sus botones en cliente (los datos se fetchean en useEffect), así que
// window siempre existe aquí; el fallback "/" es solo defensa por si se llamara en SSR.
export function publicLandingHref(): string {
  if (typeof window === "undefined") return "/";
  return `${window.location.protocol}//${window.location.host.replace(/^app\./i, "")}/`;
}
