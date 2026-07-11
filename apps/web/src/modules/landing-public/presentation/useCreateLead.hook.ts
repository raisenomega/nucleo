import { useState } from "react";
import { supabase } from "@shared/lib/supabase";
import type { ContactInput } from "@landing-public/presentation/contact/contact-form.schema";
import type { InterestedItem } from "@landing-public/domain/interested-item.types";

type State = { status: "idle" | "submitting" | "success" | "error"; confirmationMessage?: string; errorCode?: string };

// Crea lead web vía _public_create_lead (RPC anon de 3.D). Con interested → form_type='quote' + product/service_id.
export function useCreateLead() {
  const [state, setState] = useState<State>({ status: "idle" });
  async function submit(input: ContactInput, interested?: InterestedItem | null) {
    setState({ status: "submitting" });
    const payload: Record<string, unknown> = {
      form_type: interested ? "quote" : "contact", customer_name: input.name, customer_email: input.email,
      customer_phone: input.phone || undefined, message: input.message,
      utm: { source: (typeof document !== "undefined" && document.referrer) || undefined },
    };
    if (interested?.kind === "product") payload.product_id = interested.id;
    if (interested?.kind === "service") payload.service_id = interested.id;
    const { data, error } = await supabase.rpc("_public_create_lead", { _hostname: window.location.hostname, _payload: payload, _client_ip: null });
    const d = data as { status?: string; code?: string; confirmation_message?: string } | null;
    if (error || !d) return setState({ status: "error", errorCode: "network" });
    if (d.status === "error") return setState({ status: "error", errorCode: d.code });
    setState({ status: "success", confirmationMessage: d.confirmation_message });
  }
  return { ...state, submit, reset: () => setState({ status: "idle" }) };
}
