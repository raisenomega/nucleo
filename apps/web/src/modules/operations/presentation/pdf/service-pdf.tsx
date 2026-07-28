import type { ReactElement } from "react";
import { signEvidence } from "@finance/infrastructure/supabase-evidence.storage";
import { imgToDataUri } from "@shared/lib/img-to-data-uri";
import type { TranslationKey } from "@shared/i18n";
import type { PdfBrand } from "@shared/pdf/pdf-brand";
import type { RouteStop } from "@operations/domain/route.types";

type T = (k: TranslationKey) => string;
// Firma las evidencias (signed URL 1h) → data-URIs para embeder en el PDF. Cap 6/sección (evita PDF gigante;
// una foto que falle se omite, no bloquea). Las evidencias ya vienen comprimidas a JPEG desde el upload.
const toUris = async (paths: readonly string[]): Promise<string[]> =>
  (await Promise.all((await signEvidence(paths.slice(0, 6))).filter(Boolean).map(imgToDataUri))).filter((u): u is string => !!u);

export async function serviceCompletionDoc(stop: RouteStop, completedBy: string, withPhotos: boolean, brand: PdfBrand, t: T): Promise<ReactElement> {
  const { ServiceCompletionPdf } = await import("@shared/pdf/ServiceCompletionPdf");
  const photos = withPhotos ? { before: await toUris(stop.evidenceBefore), after: await toUris(stop.evidenceAfter) } : undefined;
  const data = { date: (stop.completedAt ?? stop.scheduledTime ?? "").slice(0, 16).replace("T", " "),
    address: [stop.address, stop.city].filter(Boolean).join(", "), customerName: stop.clientName,
    serviceType: stop.serviceType, notes: stop.notes, completedBy };
  const labels = { title: t("docService"), customer: t("clientName"), service: t("serviceRequested"), date: t("date"),
    address: t("address"), notes: t("notes"), before: t("photosBefore"), after: t("photosAfter"), completedBy: t("performedBy") };
  return <ServiceCompletionPdf data={data} photos={photos} brand={brand} labels={labels} />;
}
