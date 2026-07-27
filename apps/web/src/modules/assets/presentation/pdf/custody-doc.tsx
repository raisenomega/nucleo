import type { ReactElement } from "react";
import { supabaseAssetRepository } from "@assets/infrastructure/supabase-asset.repository";
import { trackMiles } from "@shared/lib/haversine";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { CustodyLog } from "@assets/domain/asset.types";

type T = (k: TranslationKey) => string;

// Recibo de custodia → CustodyReceiptPdf. Distancia GPS = suma haversine (TS) del track de esta custodia.
export async function custodyReceiptDoc(log: CustodyLog, miles: number | null, assetName: string, assetId: string, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { CustodyReceiptPdf } = await import("@shared/pdf/CustodyReceiptPdf");
  const gps = await supabaseAssetRepository.listGpsLogs(assetId);
  const pts = gps.filter((g) => g.custodyLogId === log.id);
  const gpsMiles = pts.length >= 2 ? trackMiles(pts) : null;
  const isOut = log.custodyType === "checkout";
  const blocks = [
    { title: assetName, lines: [`${t("date")}: ${log.custodyAt.slice(0, 16)}`, `${t("employee")}: ${log.employeeName}`] },
    { title: isOut ? t("checkout") : t("checkin"), lines: [
      `${t("odometer")}: ${log.odometer ?? "-"} · ${t("fuelLevel")}: ${log.fuelLevel || "-"} · ${t("gallons")}: ${log.fuelGallons ?? "-"}`,
      miles != null ? `${t("miles")}: ${Math.round(miles)}` : "", `${t("stopsCount")}: ${log.stopsCount ?? "-"}`,
      log.routeSummary ? `${t("routeSummary")}: ${log.routeSummary}` : "",
      log.conditionNotes ? `${t("conditionNotes")}: ${log.conditionNotes}` : "", log.notes ? `${t("notes")}: ${log.notes}` : ""] },
    ...(gpsMiles != null ? [{ title: t("gpsTrack"), lines: [`${t("distance")}: ${gpsMiles.toFixed(1)} mi · ${t("gpsPoints")}: ${pts.length}`] }] : []),
  ];
  return <CustodyReceiptPdf brand={brand} docTitle={`${t("printReceipt")} — ${assetName}`} blocks={blocks} signatureLabels={[t("employee"), t("warehouseManager")]} />;
}
