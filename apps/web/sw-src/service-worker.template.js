// NÚCLEO PWA service worker — stale-while-revalidate SOLO para assets estáticos.
// HTML, navegación y llamadas a Supabase van SIEMPRE a la red (nunca se sirve data vieja).
// El id de build (constante CACHE) lo inyecta scripts/inject-sw-version.mjs en cada build → SW byte-distinto
// por deploy → el browser detecta la actualización SIEMPRE → activate purga caches viejos (mata assets stale).
const CACHE = "nucleo-static-__BUILD_ID__";
const ASSET_RE = /\.(?:js|css|woff2?|png|svg|ico|webp|jpg|jpeg)$/;

self.addEventListener("install", () => {
  self.skipWaiting(); // el SW nuevo activa de inmediato, sin esperar a que cierren pestañas
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()), // toma control de las pestañas abiertas ya mismo
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !ASSET_RE.test(url.pathname)) {
    return; // deja pasar a la red (HTML, API, cross-origin)
  }
  // stale-while-revalidate: responde del cache si hay, pero revalida contra la red en background.
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((hit) => {
        const network = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return hit || network;
      }),
    ),
  );
});

// --- GPS Background Sync (Chrome/Android): descarga el buffer offline aunque la app esté cerrada. ---
const GPS_DB = "nucleo_gps", GPS_STORE = "gps_offline_buffer";
function gpsIdb(key, mode, action) {
  return new Promise((resolve) => {
    const o = indexedDB.open(GPS_DB, 1);
    o.onupgradeneeded = () => { try { o.result.createObjectStore(GPS_STORE); } catch (_) { /* existe */ } };
    o.onerror = () => resolve(null);
    o.onsuccess = () => {
      try {
        const req = action(o.result.transaction(GPS_STORE, mode).objectStore(GPS_STORE), key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (_) { resolve(null); }
    };
  });
}
async function flushGpsBuffer() {
  const pts = await gpsIdb("all", "readonly", (s, k) => s.get(k));
  const auth = await gpsIdb("auth", "readonly", (s, k) => s.get(k));
  if (!pts || !pts.length || !auth) return;
  const res = await fetch(`${auth.url}/rest/v1/rpc/batch_insert_gps_logs`, {
    method: "POST",
    headers: { apikey: auth.key, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_logs: pts }),
  });
  if (res.ok) await gpsIdb("all", "readwrite", (s, k) => s.delete(k));
  else throw new Error("gps sync retry"); // token vencido/red: el browser reintenta luego
}
self.addEventListener("sync", (event) => {
  if (event.tag === "gps-sync") event.waitUntil(flushGpsBuffer());
});

// Click en una push de notificación → enfoca una pestaña abierta o abre la URL del recurso.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus().then(() => c.navigate && c.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
