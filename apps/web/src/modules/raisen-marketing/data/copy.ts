import { es } from "@raisen-marketing/data/copy.es";
import { en } from "@raisen-marketing/data/copy.en";

// Idioma + copy centralizado. MarketingCopy = forma inferida de `es`; la asignación de COPY valida que `en`
// tenga exactamente las mismas claves y tipos (paridad ES/EN garantizada por el compilador).
export type Lang = "es" | "en";
export type MarketingCopy = typeof es;
export const COPY: Record<Lang, MarketingCopy> = { es, en };
