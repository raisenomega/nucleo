import { readFileSync, writeFileSync } from "node:fs";

// Inyecta un BUILD_ID único en cada Service Worker en cada build. Cada deploy produce SWs con bytes
// distintos → el browser SIEMPRE detecta la actualización → el handler `activate` purga los caches
// viejos (mata chunks/assets stale que crasheaban la PWA instalada, #173/#177-D). Lee los templates
// inmutables de apps/web/sw-src/ y escribe los SW servidos en apps/web/public/ (gitignored, regenerados).
const buildId = Date.now().toString(36);
const SWS = [
  ["apps/web/sw-src/service-worker-public.template.js", "apps/web/public/service-worker-public.js"],
  ["apps/web/sw-src/service-worker.template.js", "apps/web/public/service-worker.js"],
];
for (const [src, out] of SWS) {
  writeFileSync(out, readFileSync(src, "utf-8").replaceAll("__BUILD_ID__", buildId));
}
console.log(`[inject-sw-version] SW build id: ${buildId} (${SWS.length} workers)`);
