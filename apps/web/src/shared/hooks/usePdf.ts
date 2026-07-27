import { useState } from "react";
import { supabase } from "@shared/lib/supabase";
import { useI18n } from "@shared/i18n";

// PDFs vía pdf-api (Railway) → Gotenberg. FALLBACK para los tipos AÚN NO migrados a client-side.
// COEXISTENCIA (migración progresiva a @react-pdf/renderer): los tipos ya migrados NO usan este hook —
// se generan client-side vía usePdfExport + su componente <XxxPdf/> (sin servidor, sin 403 de rol).
// Ya migrados: PDF-1 (income·expense·extraordinary·payroll·training·evaluation) + PDF-2 (invoice·quote·lead·report).
// Pendientes (siguen por Railway): route · asset · asset_custody · reconciliation.
export const MIGRATED_PDF_TYPES = ["income", "expense", "extraordinary", "payroll", "training", "evaluation", "invoice", "quote", "lead", "report"] as const;
const API: string = import.meta.env.VITE_PDF_API_URL ?? "https://nucleo-production-ab48.up.railway.app";

export type PdfState = "idle" | "generating" | "done" | "error";

export function usePdf() {
  const { t } = useI18n();
  const [state, setState] = useState<PdfState>("idle");

  async function generatePdf(type: string, id?: string | null, params?: object): Promise<boolean> {
    setState("generating");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sin sesión");
      const path = id ? `/pdf/${type}/${id}` : `/pdf/${type}`;
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: params ? JSON.stringify(params) : undefined,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { url } = (await res.json()) as { url: string };
      if (!url) throw new Error("Sin URL");
      window.open(url, "_blank", "noopener");
      setState("done");
      return true;
    } catch {
      setState("error");
      window.alert(t("pdfError"));
      return false;
    }
  }

  return { state, generating: state === "generating", generatePdf };
}
