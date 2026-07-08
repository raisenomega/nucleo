// BC documents — contratos/licencias/permisos con vencimientos. Puro.
export type DocResult = { ok: true } | { ok: false; error: string };
export type DocCategory = "contract" | "agreement" | "license" | "permit" | "insurance"
  | "policy" | "manual" | "certificate" | "legal" | "other";
export type DocStatus = "draft" | "active" | "expired" | "cancelled";

export interface Doc {
  readonly id: string; readonly title: string; readonly category: DocCategory; readonly description: string | null;
  readonly fileUrl: string; readonly fileName: string; readonly parties: string[];
  readonly effectiveDate: string | null; readonly expirationDate: string | null;
  readonly status: DocStatus; readonly reminderDays: number; readonly tags: string[]; readonly createdAt: string;
}
export interface DocInput {
  title: string; category: DocCategory; description: string; fileUrl: string; fileName: string;
  parties: string[]; effectiveDate: string | null; expirationDate: string | null; reminderDays: number; tags: string[];
}
export interface ExpiringDoc { readonly id: string; readonly title: string; readonly category: string; readonly expirationDate: string; readonly daysLeft: number; }

export interface IDocumentRepository {
  list(): Promise<Doc[]>;
  upload(tenantId: string, file: File): Promise<{ path: string; name: string } | null>;
  signedUrl(path: string): Promise<string | null>;
  save(input: DocInput): Promise<DocResult>;
  setStatus(id: string, status: DocStatus, newExpiration: string | null): Promise<DocResult>;
  remove(id: string): Promise<DocResult>;
  expiring(days: number): Promise<ExpiringDoc[]>;
}
