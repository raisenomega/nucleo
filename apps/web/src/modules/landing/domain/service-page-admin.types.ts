// BC landing (panel) — CRUD de tenant_service_pages. jsonb libres editados por sub-editores.
export type Json = Record<string, unknown>;
export interface ServicePageAdmin {
  id: string; slug: string; isActive: boolean; updatedAt: string;
  hero: Json; uses: Json[]; specs: Json[]; faq: Json[]; requestForm: Json; seo: Json;
}
export type SpResult = { ok: true; id?: string } | { ok: false; error: string };

export interface IServicePagesRepository {
  list(): Promise<ServicePageAdmin[]>;
  get(id: string): Promise<ServicePageAdmin | null>;
  create(tenantId: string, slug: string, titleEs: string, titleEn: string, subtitleEs: string): Promise<SpResult>;
  save(id: string, page: ServicePageAdmin): Promise<SpResult>;
  duplicate(tenantId: string, id: string): Promise<SpResult>;
  remove(id: string): Promise<SpResult>;
  toggleActive(id: string, active: boolean): Promise<SpResult>;
}
