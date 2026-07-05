export * from "./translations.keys";
import type { Locale, TranslationKey } from "./translations.keys";
import { es } from "./translations.es";
import { en } from "./translations.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = { es, en };
