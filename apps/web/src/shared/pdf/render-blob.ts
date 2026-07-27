import type { ReactElement } from "react";

// Rinde un documento @react-pdf a Blob (import dinámico → react-pdf fuera del bundle/SSR).
// Para compartir (WhatsApp/email) en vez de abrir en pestaña como usePdfExport.
export async function renderPdfBlob(element: ReactElement): Promise<Blob | null> {
  try {
    const { pdf } = await import("@react-pdf/renderer");
    return await pdf(element as Parameters<typeof pdf>[0]).toBlob();
  } catch { return null; }
}
