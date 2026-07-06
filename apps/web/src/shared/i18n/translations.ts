export * from "./translations.keys";
import type { Locale, TranslationKey } from "./translations.keys";
import { es } from "./translations.es";
import { en } from "./translations.en";
import { esRecon } from "./translations.recon.es";
import { enRecon } from "./translations.recon.en";
import { esPayroll } from "./translations.payroll.es";
import { enPayroll } from "./translations.payroll.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: { ...es, ...esRecon, ...esPayroll }, en: { ...en, ...enRecon, ...enPayroll },
};
