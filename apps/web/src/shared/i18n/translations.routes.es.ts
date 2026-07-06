import type { TranslationKey } from "./translations.keys";

// Diccionario suplementario (rutas de servicio). Se fusiona en translations.ts.
export const esRoutes = {
  newRoute: "Nueva ruta", routeStops: "Paradas", addStop: "Agregar parada",
} satisfies Partial<Record<TranslationKey, string>>;
