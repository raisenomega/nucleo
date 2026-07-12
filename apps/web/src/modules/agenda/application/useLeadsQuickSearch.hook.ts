import { useState } from "react";
import type { ILeadsLiteRepository, LeadLite } from "@agenda/domain/leads-lite.types";

// Búsqueda + creación inline de leads para el picker del modal. Repo inyectado. lead_source='agenda'.
export function useLeadsQuickSearch(repo: ILeadsLiteRepository, tenantId: string | null, userId: string) {
  const [results, setResults] = useState<LeadLite[]>([]);
  async function search(term: string) { setResults(term.trim().length >= 2 ? await repo.search(term.trim()) : []); }
  async function create(name: string, phone: string, email: string): Promise<LeadLite | null> {
    if (!tenantId || !name.trim() || !phone.trim()) return null;
    return repo.create(tenantId, userId, name.trim(), phone.trim(), email.trim());
  }
  return { results, search, create };
}
