import type { ReactElement } from "react";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ServiceRoute, RouteStop } from "@operations/domain/route.types";

type T = (k: TranslationKey) => string;
const $ = (n: number) => `$${n.toFixed(2)}`;

// Resumen de ruta → ReportPdf (KPIs + tabla de paradas). Estado en TEXTO (Helvetica no pinta emojis).
export async function routeDoc(route: ServiceRoute, stops: readonly RouteStop[], empName: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ReportPdf } = await import("@shared/pdf/ReportPdf");
  const collected = stops.reduce((s, x) => s + (x.actualAmount ?? 0), 0);
  const notAttended = stops.filter((s) => s.status === "No atendida").length;
  const body = {
    title: `${t("routeSummary")} ${route.routeDate}`,
    kpis: [{ label: t("employee"), value: empName }, { label: t("stopsCompleted"), value: `${route.completedCount}/${route.stopCount}` },
      { label: t("notAttended"), value: notAttended }, { label: t("collect"), value: $(collected) }],
    tables: [{ title: route.assetName ? `${t("vehicle")}: ${route.assetName}` : t("routeStops"),
      headers: ["#", t("clientName"), t("serviceRequested"), t("scheduledTime"), t("status"), t("amount")],
      rows: [...stops].sort((a, b) => a.stopOrder - b.stopOrder).map((s) => [s.stopOrder, s.clientName, s.serviceType,
        s.scheduledTime ? s.scheduledTime.slice(0, 5) : "-", s.status, s.actualAmount != null ? $(s.actualAmount) : "-"]) }],
  };
  return <ReportPdf body={body} brand={brand} />;
}
