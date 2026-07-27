import { useState } from "react";
import type { ReactElement } from "react";
import { useSession } from "@shared/providers/SessionProvider";
import { renderPdfBlob } from "@shared/pdf/render-blob";
import { uploadTenantPdf } from "@shared/lib/upload-tenant-pdf";

// Comparte un PDF: lo rinde a blob, lo sube a tenant-pdfs y devuelve la signed URL (para wa.me/mailto).
// El loader hace el import dinámico del <Doc/>; subpath = "quote/xxx.pdf" (el tenant lo antepone el helper).
export function usePdfShare() {
  const { session } = useSession();
  const [sharing, setSharing] = useState(false);
  async function sharePdf(loader: () => Promise<ReactElement>, subpath: string): Promise<string | null> {
    const tenantId = session?.tenantId;
    if (!tenantId) return null;
    setSharing(true);
    try {
      const blob = await renderPdfBlob(await loader());
      return blob ? await uploadTenantPdf(tenantId, subpath, blob) : null;
    } finally {
      setSharing(false);
    }
  }
  return { sharing, sharePdf };
}
