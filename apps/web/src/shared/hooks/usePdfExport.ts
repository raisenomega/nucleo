import { useState } from "react";
import type { ReactElement } from "react";
import { useI18n } from "@shared/i18n";

// Genera un PDF client-side. @react-pdf/renderer + el componente del doc se cargan por IMPORT DINÁMICO
// (nunca en el bundle principal ni en SSR): el `loader` hace el import y devuelve el <Doc/>. Blob → pestaña.
export function usePdfExport() {
  const { t } = useI18n();
  const [generating, setGenerating] = useState(false);
  async function exportPdf(loader: () => Promise<ReactElement>): Promise<boolean> {
    setGenerating(true);
    try {
      const [{ pdf }, element] = await Promise.all([import("@react-pdf/renderer"), loader()]);
      const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      return true;
    } catch {
      window.alert(t("pdfError"));
      return false;
    } finally {
      setGenerating(false);
    }
  }
  return { generating, exportPdf };
}
