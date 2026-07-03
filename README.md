# Capa de marca — RAISEN CORE™

Esta carpeta es **la única que cambia por cliente**. El resto del repo (`src/`, `supabase/`)
es núcleo genérico, propiedad de raisen.agency, e idéntico para todos.

## Cómo funciona

- `brand.types.ts` — el contrato tipado `BrandConfig`. **Núcleo, no se edita.**
- `index.ts` — carga la marca activa según `VITE_BRAND` en el despliegue. **Núcleo.**
- `_template/` — plantilla en blanco. Se copia para cada cliente nuevo.
- `zafacones-ramos/` — cliente #1, ya poblado con datos reales.

Cada cliente tiene dos archivos editables:

1. **`brand.config.ts`** → nombre, logo, contactos, categorías, precios, Stripe, features.
2. **`theme.css`** → colores y estilo. Solo se toca el bloque `EDITABLE POR CLIENTE`
   (primario, secundario, acento, radio, tipografía). Todo lo demás se deriva.

El mismo token de marca lo consumen **el sitio público y el panel de finanzas**, así que
el cliente ve SU color también dentro de la app interna.

## Dar de alta un cliente nuevo (manual, luego se automatiza con scripts/new-client.sh)

```bash
cp -r brand/_template brand/mi-cliente
# editar brand/mi-cliente/brand.config.ts  (valores marcados con ← CAMBIAR)
# editar brand/mi-cliente/theme.css        (bloque EDITABLE POR CLIENTE)
# agregar la línea de import + entrada al REGISTRY en brand/index.ts
# desplegar con VITE_BRAND=mi-cliente
```

## Regla innegociable

Si al programar el núcleo aparece la tentación de escribir un nombre de cliente,
un color fijo o un teléfono dentro de `src/` → **está prohibido**. Ese valor pertenece
aquí. Es lo que mantiene el producto vendible como licencia a cualquier cliente.
