import { useEffect } from "react";
import { supabase } from "@shared/lib/supabase";

// Marca viewed_at al abrir el detalle de un lead web (baja el badge del sidebar). Solo lead_source web.
// El query de supabase-js es lazy: hay que .then()/await para que EJECUTE (con `void` sin then no corría → bug).
// Al terminar emite 'leads-badge-refresh' para que el badge del sidebar refresque sin recargar (el detalle es modal).
export function useMarkLeadViewed(leadId: string, leadSource: string) {
  useEffect(() => {
    if (leadSource !== "web-landing") return;
    void supabase.from("leads").update({ viewed_at: new Date().toISOString() }).eq("id", leadId).is("viewed_at", null)
      .then(() => { if (typeof window !== "undefined") window.dispatchEvent(new Event("leads-badge-refresh")); });
  }, [leadId, leadSource]);
}
