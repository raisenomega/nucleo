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
import { esBilling } from "./translations.billing.es";
import { enBilling } from "./translations.billing.en";
import { esQuotes } from "./translations.quotes.es";
import { enQuotes } from "./translations.quotes.en";
import { esPdf } from "./translations.pdf.es";
import { enPdf } from "./translations.pdf.en";
import { esBrand } from "./translations.brand.es";
import { enBrand } from "./translations.brand.en";
import { esLanding } from "./translations.landing.es";
import { enLanding } from "./translations.landing.en";
import { esAgenda } from "./translations.agenda.es";
import { enAgenda } from "./translations.agenda.en";
import { esOrders } from "./translations.orders.es";
import { enOrders } from "./translations.orders.en";
import { esOrdersPublic } from "./translations.orders-public.es";
import { enOrdersPublic } from "./translations.orders-public.en";
import { esOrderForms } from "./translations.order-forms.es";
import { enOrderForms } from "./translations.order-forms.en";
import { esInventory } from "./translations.inventory.es";
import { enInventory } from "./translations.inventory.en";

export const translations: Record<Locale, Record<TranslationKey, string>> = {
  es: { ...es, ...esRecon, ...esPayroll, ...esEmployee, ...esRoutes, ...esReports, ...esHr, ...esDocs, ...esBilling, ...esQuotes, ...esPdf, ...esBrand, ...esLanding, ...esAgenda, ...esOrders, ...esOrdersPublic, ...esOrderForms, ...esInventory },
  en: { ...en, ...enRecon, ...enPayroll, ...enEmployee, ...enRoutes, ...enReports, ...enHr, ...enDocs, ...enBilling, ...enQuotes, ...enPdf, ...enBrand, ...enLanding, ...enAgenda, ...enOrders, ...enOrdersPublic, ...enOrderForms, ...enInventory },
};
