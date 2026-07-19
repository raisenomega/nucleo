// SW landing/portal white-label — MÍNIMO: solo cachea imágenes/fonts/CSS estáticos. HTML, JS/chunks y API
// van SIEMPRE a la red → cero posibilidad de servir un shell o chunk viejo al cliente (fuente de los crashes
// de PWA stale, #173/#177-D). Mantiene la instalabilidad (SW con fetch handler). Scope '/'.
// El id de build (constante CACHE) lo inyecta scripts/inject-sw-version.mjs en cada build → SW byte-distinto.
const CACHE = "landing-public-__BUILD_ID__";
const ASSET_RE = /\.(?:css|woff2?|png|svg|ico|webp|jpg|jpeg)$/;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Deja pasar a la RED todo lo que no sea imagen/font/CSS del mismo origen: HTML/navegación, JS/chunks y API
  // nunca se cachean → el cliente siempre recibe el shell y los chunks frescos del deploy actual.
  if (request.method !== "GET" || url.origin !== self.location.origin || !ASSET_RE.test(url.pathname)) return;
  // cache-first solo para estáticos versionados por hash (nombre = contenido → seguros de cachear).
  event.respondWith(caches.open(CACHE).then((cache) =>
    cache.match(request).then((hit) => hit || fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }))));
});
