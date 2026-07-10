import { useState, useCallback } from "react";
import { createApprovalToken, markQuoteSent, savePdfUrl } from "@quotes/infrastructure/supabase-quote-send.repository";
import { uploadQuotePdf } from "@shared/lib/pdf-download-and-upload";

export type SendResult = { approvalUrl: string };

// Orquesta el envío: token → PDF fresh (best-effort) → send_quote. wa.me lleva solo el approval URL.
export function useQuoteSend(tenantId: string) {
  const [sending, setSending] = useState(false);
  const send = useCallback(async (quoteId: string, channels: string[], message: string): Promise<SendResult | null> => {
    setSending(true);
    try {
      const tok = await createApprovalToken(quoteId);
      if (!tok) return null;
      // PDF fresh en cada envío (incluye reenvíos); si el pdf-api falla → pdf_url=NULL (degradación honesta).
      const pdfUrl = await uploadQuotePdf(tenantId, quoteId);
      await savePdfUrl(quoteId, pdfUrl, pdfUrl ? new Date(Date.now() + 7 * 864e5).toISOString() : null);
      if (!(await markQuoteSent(quoteId, channels, tok.tokenPlain, message))) return null;
      return { approvalUrl: tok.approvalUrl };
    } finally {
      setSending(false);
    }
  }, [tenantId]);
  return { send, sending };
}
