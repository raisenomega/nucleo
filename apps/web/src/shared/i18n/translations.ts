export * from "./translations.keys";
import type { Locale, TranslationKey } from "./translations.keys";
import { es } from "./translations.es";
import { en } from "./translations.en";
import { esRecon } from "./translations.recon.es";
import { enRecon } from "./translations.recon.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: { ...es, ...esRecon }, en: { ...en, ...enRecon },
};
