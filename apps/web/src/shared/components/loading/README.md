# Primitivas de estado de UI (`@shared/components/loading`)

Base compartida de loading / empty / error. **Presentacionales puras** (sin i18n ni fetch): el
consumidor pasa strings ya traducidos. Todas usan tokens semánticos → dark mode automático.

```ts
import { Skeleton, Spinner, EmptyState, ErrorBoundary } from "@shared/components/loading";
```

## `<Skeleton>`
Placeholder de carga. `variant`: `rect` (default) · `text` (con `lines>1` renderiza N líneas, última al 60%) · `circle`.
```tsx
<Skeleton className="h-40 w-full" />                 // bloque
<Skeleton variant="text" lines={3} />                // párrafo
<Skeleton variant="circle" width={64} height={64} /> // avatar
```

## `<Spinner>`
Wrap de `Loader2`. `size`: `sm|md|lg` (16/20/24px). `label` = aria-label (default "Cargando…").
```tsx
<Spinner size="lg" className="text-primary" />
```

## `<EmptyState>`
Centrado: icono (default `Inbox`) + `title` (requerido, ya traducido) + `description?` + slot `children` (CTA). `size`: `sm|md|lg`.
```tsx
<EmptyState icon={Package} title={t("noRecords")} description={t("noRecordsHint")}>
  <button>…</button>
</EmptyState>
```

## `<ErrorBoundary>`
Global, ya montado en `__root` alrededor del `<Outlet/>`. Class component (React puro, sin hooks/context/i18n
— un provider pudo caer). Texto por `navigator.language` (ES/EN). Fallback: recargar / volver al inicio.
Normalmente **no** se instancia a mano; envolver subárboles solo para aislar fallos localizados.

## Anti-patrones
- ❌ No metas i18n dentro de estas primitivas — pasá el string traducido como prop.
- ❌ No pongas contenedor/fondo en `Spinner` — decide el consumidor.
- ❌ No uses colores hardcodeados — solo tokens (`bg-muted`, `text-foreground`, `text-destructive`…).
- ❌ No hagas fetch ni lógica async acá — son presentacionales.

## Roadmap
- **REFACTOR-2** (siguiente): adoptar en `@landing-public` (5 hooks + consumers; `DetailSkeleton` → `Skeleton`, skip-empty → `EmptyState` donde aplique).
- **REFACTOR-3**: TTL + invalidación del cache `Map` de los hooks landing.
- **REFACTOR-4**: refactor del panel operacional (unificar `isLoading`/empty).
