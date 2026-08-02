import type { TranslationKey } from "@shared/i18n/translations.keys";

// De las 12 RPC de este BC, tres lanzan NOT_AUTHORIZED (get_ar_aging, get_ap_aging, get_fleet_positions) y
// NINGUNA devuelve {error}. No nacen claves i18n: ordErrForbidden ya lo dice. Gemelo de statement-error.ts
// del BC accounting: cada BC mapea lo suyo, como con Result.
export const rpcErr = (e: string, t: (k: TranslationKey) => string): string =>
  /forbidden|NOT_AUTHORIZED/i.test(e) ? t("ordErrForbidden") : e;
