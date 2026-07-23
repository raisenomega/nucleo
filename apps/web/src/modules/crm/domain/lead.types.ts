// BC crm — tipos de dominio de leads v2 (contacto + origen/servicio config + items). Puro.
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export interface LeadItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly taxPct: number;
  readonly discountPct: number;
  readonly lineTotal: number; // calculado por la DB (read) o client-side (form)
}

export interface Lead {
  readonly id: string;
  readonly tenantId: string;
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly city: string;
  readonly zipCode: string;
  readonly leadSource: string;        // legacy text
  readonly serviceRequested: string;  // legacy text
  readonly leadSourceId: string;
  readonly leadSourceLabel: string;   // join a categories
  readonly serviceTypeId: string;
  readonly serviceTypeLabel: string;  // join a categories
  readonly temperature: string;
  readonly status: string;
  readonly callDate: string;
  readonly notes: string;
  readonly quotedPrice: number;
  readonly createdAt: string;
  readonly evidenceUrls: readonly string[];
  readonly customFields: readonly { readonly label: string; readonly value: string }[];
  readonly items: readonly LeadItem[];
  readonly customerId: string | null;   // 2.6d · enlace al maestro (solo enlaza, nunca crea)
}

export interface LeadFormData {
  readonly contactName: string;
  readonly phone: string;
  readonly email: string;
  readonly temperature: string;
  readonly status: string;
  readonly callDate: string;
  readonly notes: string;
  readonly leadSource?: string;
  readonly serviceRequested?: string;
  readonly address?: string;
  readonly city?: string;
  readonly zipCode?: string;
  readonly leadSourceId?: string;
  readonly serviceTypeId?: string;
  readonly quotedPrice?: number;
  readonly items?: readonly LeadItem[];
  readonly evidenceUrls?: readonly string[];
  readonly customerId?: string | null;
}

export type LeadListResult = Result<Lead[], string>;

export interface ILeadRepository {
  list(): Promise<LeadListResult>;
  create(data: LeadFormData): Promise<Result<null, string>>;
  update(id: string, data: LeadFormData): Promise<Result<null, string>>;
  remove(id: string): Promise<Result<null, string>>;
}
