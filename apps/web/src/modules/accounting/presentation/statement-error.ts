import type { TranslationKey } from "@shared/i18n/translations.keys";

// Las 3 RPC de estados financieros no dan texto presentable: get_income_statement y get_balance_sheet
// devuelven el codigo 'forbidden', y get_cash_flow_statement lanza NOT_AUTHORIZED. Los dos casos son lo
// mismo y ya existe la clave que lo dice, asi que aqui no nacen claves nuevas.
export const stmtErr = (e: string, t: (k: TranslationKey) => string): string =>
  /forbidden|NOT_AUTHORIZED/i.test(e) ? t("ordErrForbidden") : e;
