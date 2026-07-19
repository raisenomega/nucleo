// SW landing pública white-label — network-first para HTML/navegación, cache-first para assets. Scope '/'.
const CACHE = "landing-public-v3";
const ASSET_RE = /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg)$/;

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
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (ASSET_RE.test(url.pathname)) {
    // cache-first: assets estáticos versionados por hash, seguros de cachear.
    event.respondWith(caches.open(CACHE).then((cache) =>
      cache.match(request).then((hit) => hit || fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; }))));
    return;
  }
  // network-first: HTML/navegación siempre fresco; fallback al cache (o al shell '/') si no hay red.
  event.respondWith(
    fetch(request).then((res) => {
      if (res.ok && request.mode === "navigate") { const c = res.clone(); void caches.open(CACHE).then((cache) => cache.put(request, c)); }
      return res;
    }).catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
  );
});
