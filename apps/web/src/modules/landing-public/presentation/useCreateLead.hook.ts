import { useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ContactInput } from "@landing-public/presentation/contact/contact-form.schema";

type State = { status: "idle" | "submitting" | "success" | "error"; confirmationMessage?: string; errorCode?: string };

// Crea lead web vía _public_create_lead (RPC anon de 3.D). form_type='contact'. utm.source = referrer.
export function useCreateLead() {
  const [state, setState] = useState<State>({ status: "idle" });
  async function submit(input: ContactInput) {
    setState({ status: "submitting" });
    const payload = {
      form_type: "contact", customer_name: input.name, customer_email: input.email,
      customer_phone: input.phone || undefined, message: input.message,
      utm: { source: (typeof document !== "undefined" && document.referrer) || undefined },
    };
    const { data, error } = await supabase.rpc("_public_create_lead", { _hostname: window.location.hostname, _payload: payload, _client_ip: null });
    const d = data as { status?: string; code?: string; confirmation_message?: string } | null;
    if (error || !d) return setState({ status: "error", errorCode: "network" });
    if (d.status === "error") return setState({ status: "error", errorCode: d.code });
    setState({ status: "success", confirmationMessage: d.confirmation_message });
  }
  return { ...state, submit, reset: () => setState({ status: "idle" }) };
}
