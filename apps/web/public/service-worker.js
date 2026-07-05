// NÚCLEO PWA service worker — cache-first SOLO para assets estáticos.
// HTML, navegación y llamadas a Supabase van SIEMPRE a la red (nunca se sirve data vieja).
const CACHE = "nucleo-static-v1";
const ASSET_RE = /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg)$/;

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !ASSET_RE.test(url.pathname)) {
    return; // deja pasar a la red (HTML, API, cross-origin)
  }
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        }),
      ),
    ),
  );
});
