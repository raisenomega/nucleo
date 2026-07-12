import type { LeadLite } from "@agenda/domain/leads-lite.types";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// Notas iniciales sugeridas al elegir un lead: texto legible de service_requested (sin UUIDs/tokens) + notes.
export function buildInitialNotes(lead: LeadLite): string {
  const readable = lead.serviceRequested.replace(UUID, "").replace(/quote|contact|service_request|·|null/gi, "").trim();
  return [readable, lead.notes].filter((s) => s.length > 1).join("\n\n");
}
