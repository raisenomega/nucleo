import type { TranslationKey } from "@shared/i18n";
import type { Asset } from "@assets/domain/asset.types";
import { assetValue, expiringSoon } from "@assets/application/asset-helpers";
import { ASSET_TYPE, STATUS } from "@assets/presentation/asset-labels";

type T = (k: TranslationKey) => string;
const money = (n: number) => `$${n.toFixed(2)}`;

// Reporte de activos → body de /pdf/report: resumen (KPIs) + listado + alertas de garantía/seguro.
export function assetsReportBody(items: readonly Asset[], now: Date, t: T) {
  const value = items.reduce((s, a) => s + assetValue(a), 0);
  const inUse = items.filter((a) => a.status === "in_use");
  const maint = items.filter((a) => a.status === "maintenance");
  const expiring = items.filter((a) => expiringSoon(a, now));
  return {
    title: t("assetReport"), date_from: "", date_to: "", charts: [] as never[],
    kpis: [
      { label: t("totalAssets"), value: String(items.length) }, { label: t("assetsValue"), value: money(value) },
      { label: t("inMaintenance"), value: String(maint.length) }, { label: t("inUseBy"), value: String(inUse.length) },
      { label: t("warrantyAlert"), value: String(expiring.length) },
    ],
    tables: [
      { title: t("assets"), headers: [t("name"), t("assetType"), t("status"), t("assignedTo"), t("value")],
        rows: items.map((a) => [a.name, t(ASSET_TYPE[a.assetType]), t(STATUS[a.status].key), a.assignedToName || "—", money(assetValue(a))]) },
      { title: t("warrantyAlert"), headers: [t("name"), t("warrantyExpires"), t("insuranceExpires")],
        rows: expiring.map((a) => [a.name, a.warrantyExpires ?? "—", a.insuranceExpires ?? "—"]) },
    ],
  };
}
