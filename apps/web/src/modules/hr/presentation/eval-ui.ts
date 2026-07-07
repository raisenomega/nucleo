import type { TranslationKey } from "@shared/i18n";
import type { Classification } from "@hr/domain/evaluation.types";

// Color por clasificación (Tailwind, no hex) + key de traducción.
export const CLASS_COLOR: Record<Classification, string> = {
  excelente: "bg-green-100 text-green-800",
  bueno: "bg-blue-100 text-blue-800",
  necesita_mejora: "bg-yellow-100 text-yellow-800",
  insuficiente: "bg-red-100 text-red-800",
};
export const CLASS_KEY: Record<Classification, TranslationKey> = {
  excelente: "clExcelente", bueno: "clBueno", necesita_mejora: "clNecesitaMejora", insuficiente: "clInsuficiente",
};
