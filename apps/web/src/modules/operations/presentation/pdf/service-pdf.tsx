import type { ReactElement } from "react";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { RouteStop } from "@operations/domain/route.types";

type T = (k: TranslationKey) => string;
// Firma las evidencias (signed URL 1h) → data-URIs para embeder en el PDF.
const toUris = async (paths: readonly string[]): Promise<string[]> =>
  (await Promise.all((await signEvidence(paths)).filter(Boolean).map(imgToDataUri))).filter((u): u is string => !!u);

export async function serviceCompletionDoc(stop: RouteStop, completedBy: string, withPhotos: boolean, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ServiceCompletionPdf } = await import("@shared/pdf/ServiceCompletionPdf");
  const photos = withPhotos ? { before: await toUris(stop.evidenceBefore), after: await toUris(stop.evidenceAfter) } : undefined;
  const data = { date: (stop.completedAt ?? stop.scheduledTime ?? "").slice(0, 16),
    address: [stop.address, stop.city].filter(Boolean).join(", "), customerName: stop.clientName,
    serviceType: stop.serviceType, notes: stop.notes, completedBy };
  const labels = { title: t("docService"), customer: t("clientName"), service: t("serviceRequested"), date: t("date"),
    notes: t("notes"), before: t("photosBefore"), after: t("photosAfter"), completedBy: t("performedBy") };
  return <ServiceCompletionPdf data={data} photos={photos} brand={brand} labels={labels} />;
}
