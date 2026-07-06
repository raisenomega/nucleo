export * from "./translations.keys";
import type { Locale, TranslationKey } from "./translations.keys";
import { es } from "./translations.es";
import { en } from "./translations.en";
import { esRecon } from "./translations.recon.es";
import { enRecon } from "./translations.recon.en";
import { esPayroll } from "./translations.payroll.es";
import { enPayroll } from "./translations.payroll.en";
import { esEmployee } from "./translations.employee.es";
import { enEmployee } from "./translations.employee.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: { ...es, ...esRecon, ...esPayroll, ...esEmployee }, en: { ...en, ...enRecon, ...enPayroll, ...enEmployee },
};
