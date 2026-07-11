import type { TranslationKey } from "@shared/i18n";
import type { Classification, EvalType } from "@hr/domain/evaluation.types";

export const EVT_KEY: Record<EvalType, TranslationKey> = {
  top_down: "evTopDown", peer: "evPeer", bottom_up: "evBottomUp", self: "evSelf",
};

// Color por clasificación (Tailwind, no hex) + key de traducción.
export const CLASS_COLOR: Record<Classification, string> = {
  excelente: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300",
  bueno: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  necesita_mejora: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300",
  insuficiente: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
};
export const CLASS_KEY: Record<Classification, TranslationKey> = {
  excelente: "clExcelente", bueno: "clBueno", necesita_mejora: "clNecesitaMejora", insuficiente: "clInsuficiente",
};
