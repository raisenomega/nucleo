import type { TranslationKey } from "@shared/i18n";
import type { ObsCategory } from "@hr/domain/observation.types";

export const CATEGORIES: ObsCategory[] = ["LOGRO", "OPORTUNIDAD_MEJORA", "INCIDENTE", "CULTURAL", "SUGERENCIA_DESARROLLO"];
export const CAT_COLOR: Record<ObsCategory, string> = {
  LOGRO: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  OPORTUNIDAD_MEJORA: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  INCIDENTE: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  CULTURAL: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  SUGERENCIA_DESARROLLO: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
};
export const CAT_KEY: Record<ObsCategory, TranslationKey> = {
  LOGRO: "obsLogro", OPORTUNIDAD_MEJORA: "obsMejora", INCIDENTE: "obsIncidente",
  CULTURAL: "obsCultural", SUGERENCIA_DESARROLLO: "obsDesarrollo",
};
