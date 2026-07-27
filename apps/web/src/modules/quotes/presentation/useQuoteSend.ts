import { useState, useCallback } from "react";
import { createApprovalToken, markQuoteSent, savePdfUrl } from "@quotes/infrastructure/supabase-quote-send.repository";

export type SendResult = { approvalUrl: string };

// Orquesta el envío: token → PDF fresh (client-side, best-effort vía uploadPdf) → send_quote.
// uploadPdf lo provee el caller: rinde el <QuotePdf/> a blob y lo sube a tenant-pdfs con signed URL 7d.
export function useQuoteSend() {
  const [sending, setSending] = useState(false);
  const send = useCallback(async (quoteId: string, channels: string[], message: string, uploadPdf: () => Promise<string | null>): Promise<SendResult | null> => {
    setSending(true);
    try {
      const tok = await createApprovalToken(quoteId);
      if (!tok) return null;
      const pdfUrl = await uploadPdf();  // si falla → pdf_url=NULL (degradación honesta)
      await savePdfUrl(quoteId, pdfUrl, pdfUrl ? new Date(Date.now() + 7 * 864e5).toISOString() : null);
      if (!(await markQuoteSent(quoteId, channels, tok.tokenPlain, message))) return null;
      return { approvalUrl: tok.approvalUrl };
    } finally {
      setSending(false);
    }
  }, []);
  return { send, sending };
}
