import type { ReactElement } from "react";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import { ASSET_TYPE, CONDITION, STATUS, MAINT_TYPE } from "@assets/presentation/asset-labels";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { Asset, MaintenanceLog, AssetRoute, CustodyLog } from "@assets/domain/asset.types";

type T = (k: TranslationKey) => string;
const $ = (n: number | null) => (n != null ? `$${n.toFixed(2)}` : "-");

// Ficha de activo → AssetDetailPdf. Imagen remota → data-URI. Custodia/mant./rutas ya cargadas por el detalle.
export async function assetDoc(asset: Asset, custody: CustodyLog[], logs: MaintenanceLog[], routes: AssetRoute[], showCost: boolean, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { AssetDetailPdf } = await import("@shared/pdf/AssetDetailPdf");
  const image = asset.imageUrl ? await imgToDataUri(asset.imageUrl) : null;
  const info = [
    { label: t("assetType"), value: t(ASSET_TYPE[asset.assetType]) }, { label: t("category"), value: asset.category || "-" },
    { label: t("brand"), value: [asset.brand, asset.model].filter(Boolean).join(" ") || "-" }, { label: t("serialNumber"), value: asset.serialNumber || "-" },
    { label: t("condition"), value: t(CONDITION[asset.condition]) }, { label: t("status"), value: t(STATUS[asset.status].key) },
    { label: t("assignedTo"), value: asset.assignedToName || "-" }, { label: t("location"), value: asset.location || "-" },
    ...(showCost ? [{ label: t("currentValue"), value: $(asset.currentValue) }] : []),
  ];
  const sections = [
    { title: t("custodyHistory"), headers: [t("date"), t("employee"), t("assetType"), t("odometer")],
      rows: custody.map((c) => [c.custodyAt.slice(0, 10), c.employeeName, c.custodyType === "checkout" ? t("checkout") : t("checkin"), c.odometer ?? "-"]) },
    { title: t("maintenanceHistory"), headers: [t("date"), t("maintenanceType"), t("cost")],
      rows: logs.map((m) => [m.performedAt, t(MAINT_TYPE[m.maintenanceType]), showCost && m.cost > 0 ? $(m.cost) : "-"]) },
    ...(routes.length ? [{ title: t("routesDone"), headers: [t("date"), t("stopsCount"), t("status")], rows: routes.map((r) => [r.routeDate, r.stopsCount, r.status]) }] : []),
  ];
  return <AssetDetailPdf brand={brand} docTitle={`${t("assetReport")} — ${asset.name}`} image={image} infoRows={info} sections={sections} />;
}
