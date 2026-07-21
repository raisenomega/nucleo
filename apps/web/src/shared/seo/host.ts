import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHost } from "@tanstack/react-start/server";

// Hosts donde vive la landing COMERCIAL de NÚCLEO. Fuera de esta lista el host es de un tenant (white-label):
// ahí NO se emite ningún meta de NÚCLEO — un canonical a nucleoraisen.com desindexaría el sitio del tenant.
const RAISEN_HOSTS = new Set(["nucleoraisen.com", "www.nucleoraisen.com", "nucleo-blush.vercel.app", "localhost"]);

// Host de la request. En SSR sale de la cabecera (x-forwarded-host en Vercel); en cliente, de location.
// El branch .server() lo elimina el plugin de TanStack Start del bundle de cliente.
const currentHost = createIsomorphicFn()
  .server((): string => {
    try { return getRequestHost({ xForwardedHost: true }); } catch { return ""; }
  })
  .client((): string => window.location.hostname);

// true solo en los dominios de la landing comercial. Ante duda (host vacío) devuelve false: es el lado seguro,
// porque el fallo se degrada a "sin meta" en vez de a "meta de NÚCLEO en el dominio de un tenant".
export function isRaisenSeoHost(): boolean {
  const h = (currentHost() || "").split(":")[0]?.toLowerCase() ?? "";
  return RAISEN_HOSTS.has(h);
}
