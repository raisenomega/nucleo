// BC admin — branding del tenant (tab Plantillas). Puro.
import type { RepoResult } from "@admin/domain/admin.types";

export interface TenantIdentity {
  readonly legalName: string;
  readonly displayName: string;
}

// Datos de contacto del negocio que siguen en settings (NO son tema). Los colores viven en tenant_themes.
export const BRAND_KEYS = ["company_address", "company_phone", "company_email", "company_website", "company_tax_id"] as const;
export type BrandKey = (typeof BRAND_KEYS)[number];

export interface IBrandRepository {
  getIdentity(): Promise<TenantIdentity | null>;
  updateIdentity(legalName: string, displayName: string): Promise<RepoResult>;
  uploadLogo(tenantId: string, file: File): Promise<RepoResult>;
  logoUrl(tenantId: string): Promise<string | null>;
  faviconUrl(tenantId: string): Promise<string | null>;
  getTheme(): Promise<Record<string, string | null>>;
  saveTheme(tenantId: string, fields: Record<string, string | null>): Promise<RepoResult>;
}
