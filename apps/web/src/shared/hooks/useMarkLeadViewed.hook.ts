import { useEffect } from "react";
import { supabase } from "@shared/lib/supabase";

// Marca viewed_at al abrir el detalle de un lead web (baja el badge del sidebar). Solo lead_source web.
export function useMarkLeadViewed(leadId: string, leadSource: string) {
  useEffect(() => {
    if (leadSource !== "web-landing") return;
    void supabase.from("leads").update({ viewed_at: new Date().toISOString() }).eq("id", leadId).is("viewed_at", null);
  }, [leadId, leadSource]);
}
