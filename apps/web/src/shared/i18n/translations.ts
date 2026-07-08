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
import { esRoutes } from "./translations.routes.es";
import { enRoutes } from "./translations.routes.en";
import { esReports } from "./translations.reports.es";
import { enReports } from "./translations.reports.en";
import { esHr } from "./translations.hr.es";
import { enHr } from "./translations.hr.en";
import { esDocs } from "./translations.docs.es";
import { enDocs } from "./translations.docs.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: { ...es, ...esRecon, ...esPayroll, ...esEmployee, ...esRoutes, ...esReports, ...esHr, ...esDocs },
  en: { ...en, ...enRecon, ...enPayroll, ...enEmployee, ...enRoutes, ...enReports, ...enHr, ...enDocs },
};
