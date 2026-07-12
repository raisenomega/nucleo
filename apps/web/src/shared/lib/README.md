# `shared/lib` — utilidades

## TTL Cache (`ttl-cache.ts` + `ttl-cache.constants.ts`)

Cache en memoria (module-level) con expiración. Usado por los hooks read-only de `@landing-public`
para no refetchear en cada navegación SPA, pero refrescando pasado el TTL (evita data stale).

```ts
import { createTtlCache } from "@shared/lib/ttl-cache";
import { TTL_SHORT_60S } from "@shared/lib/ttl-cache.constants";

const cache = createTtlCache<MiTipo>(TTL_SHORT_60S);
const hit = cache.get(key);        // null = miss o expirado → refetch
if (!hit) { const v = await fetchIt(); cache.set(key, v); }
```

### Qué TTL usar
- **`TTL_SHORT_60S`** — catálogo, product/service/package detail, dropdown de quote. Impactan
  checkout/precios → conviene refrescar seguido.
- **`TTL_MEDIUM_5M`** — home data-driven y resolución de marca por hostname. Cambian rara vez.
- **`TTL_LONG_1H`** — reservado para data casi estática.

### Limitaciones (por diseño, follow-ups pinneados)
- **Solo cachea valores no-null.** `get()` devuelve `null` para miss/expirado, así que un `null`
  legítimo (notfound) no se distingue de un miss → no se cachea (refetch en revisita). Aceptado.
- **Module-level, no cross-tab.** Si Roy edita en el panel (`app.*`), la landing (`zramos.com`, otro
  origin) muestra data vieja hasta que expire el TTL o el usuario navegue tras la expiración.
  Cross-tab invalidation (BroadcastChannel intra-origin / Supabase Realtime) = follow-up.
- **Sin `invalidate()` imperativo** — follow-up.
