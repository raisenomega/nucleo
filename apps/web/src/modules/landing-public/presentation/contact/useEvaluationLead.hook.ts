import { useState } from "react";
import { supabase } from "@shared/lib/supabase";

type State = { status: "idle" | "submitting" | "success" | "error"; confirmationMessage?: string };

// Crea el lead de solicitud de evaluación vía _public_create_lead. Si tenemos el service_id de Evaluación usamos
// form_type='service_request' (lo liga al servicio + preferred_date); si no, cae a 'contact'. Datos extra → message.
export function useEvaluationLead() {
  const [state, setState] = useState<State>({ status: "idle" });
  async function submit(p: { name: string; email: string; phone: string; message: string; serviceId?: string; preferredDate: string }) {
    setState({ status: "submitting" });
    const useSvc = Boolean(p.serviceId);
    const payload: Record<string, unknown> = {
      form_type: useSvc ? "service_request" : "contact",
      customer_name: p.name, customer_email: p.email, customer_phone: p.phone || undefined, message: p.message,
    };
    if (useSvc) { payload.service_id = p.serviceId; payload.preferred_date = p.preferredDate; }
    const { data, error } = await supabase.rpc("_public_create_lead", { _hostname: window.location.hostname, _payload: payload, _client_ip: null });
    const d = data as { status?: string; confirmation_message?: string } | null;
    if (error || !d || d.status === "error") return void setState({ status: "error" });
    setState({ status: "success", confirmationMessage: d.confirmation_message });
  }
  return { ...state, submit, reset: () => setState({ status: "idle" }) };
}
