import { useState, useCallback } from "react";
import { createApprovalToken, markQuoteSent } from "@quotes/infrastructure/supabase-quote-send.repository";
import { uploadQuotePdf } from "@shared/lib/pdf-download-and-upload";

export type SendResult = { pdfUrl: string | null; approvalUrl: string };

// Orquesta el envío atómico: token → (PDF solo si WhatsApp) → send_quote. null si algún paso falla.
export function useQuoteSend(tenantId: string) {
  const [sending, setSending] = useState(false);
  const send = useCallback(async (quoteId: string, channels: string[], message: string): Promise<SendResult | null> => {
    setSending(true);
    try {
      const tok = await createApprovalToken(quoteId);
      if (!tok) return null;
      let pdfUrl: string | null = null;
      if (channels.includes("whatsapp")) {
        pdfUrl = await uploadQuotePdf(tenantId, quoteId);
        if (!pdfUrl) return null; // falla PDF → NO se marca enviada
      }
      if (!(await markQuoteSent(quoteId, channels, tok.tokenPlain, message))) return null;
      return { pdfUrl, approvalUrl: tok.approvalUrl };
    } finally {
      setSending(false);
    }
  }, [tenantId]);
  return { send, sending };
}
