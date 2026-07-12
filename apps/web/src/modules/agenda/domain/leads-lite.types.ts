export interface LeadLite { id: string; name: string; phone: string; email: string; serviceRequested: string; notes: string; }
export interface ILeadsLiteRepository {
  search(term: string): Promise<LeadLite[]>;
  create(tenantId: string, userId: string, name: string, phone: string, email: string): Promise<LeadLite | null>;
}
