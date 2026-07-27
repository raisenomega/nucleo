import type { ReactElement } from "react";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { ReportBody } from "@shared/pdf/ReportPdf";

// Loader del reporte genérico → ReportPdf. El body ({title, kpis, tables}) ya lo arma cada caller
// (buildReportBody / inventoryReportBody / assetsReportBody / AR / FinanceReportButton).
export async function reportDoc(body: ReportBody, brand: PdfBrand): Promise<ReactElement> {
  const { ReportPdf } = await import("@shared/pdf/ReportPdf");
  return <ReportPdf body={body} brand={brand} />;
}
