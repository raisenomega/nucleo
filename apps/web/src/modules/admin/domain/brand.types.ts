// BC admin — branding del tenant (tab Plantillas). Puro.
import type { RepoResult } from "@admin/domain/admin.types";

export interface TenantIdentity {
  readonly legalName: string;
  readonly displayName: string;
}

// Claves de settings usadas por el branding (los PDFs las leen del lado del pdf-api).
export const BRAND_KEYS = ["company_address", "company_phone", "company_email", "company_website", "company_tax_id", "primary_color", "accent_color"] as const;
export type BrandKey = (typeof BRAND_KEYS)[number];

export interface IBrandRepository {
  getIdentity(): Promise<TenantIdentity | null>;
  updateIdentity(legalName: string, displayName: string): Promise<RepoResult>;
  uploadLogo(tenantId: string, file: File): Promise<RepoResult>;
  logoUrl(tenantId: string): Promise<string | null>;
}
