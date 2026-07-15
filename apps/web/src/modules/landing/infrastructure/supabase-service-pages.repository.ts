import { supabase } from "@shared/lib/supabase";
import type { IServicePagesRepository, ServicePageAdmin, SpResult, Json } from "@landing/domain/service-page-admin.types";

const SEL = "id,slug,is_active,updated_at,hero,uses,specs,faq,request_form,seo";
type Row = { id: string; slug: string; is_active: boolean; updated_at: string; hero: Json; uses: unknown; specs: unknown; faq: unknown; request_form: Json; seo: Json };
const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
const toPage = (r: Row): ServicePageAdmin => ({
  id: r.id, slug: r.slug, isActive: r.is_active, updatedAt: r.updated_at,
  hero: r.hero ?? {}, uses: arr(r.uses), specs: arr(r.specs), faq: arr(r.faq), requestForm: r.request_form ?? {}, seo: r.seo ?? {},
});
const ok = (e: { message: string } | null, id?: string): SpResult => (e ? { ok: false, error: e.message } : { ok: true, id });

export const supabaseServicePagesRepository: IServicePagesRepository = {
  async list() {
    const { data } = await supabase.from("tenant_service_pages").select(SEL).order("updated_at", { ascending: false });
    return ((data as Row[] | null) ?? []).map(toPage);
  },
  async get(id) {
    const { data } = await supabase.from("tenant_service_pages").select(SEL).eq("id", id).maybeSingle();
    return data ? toPage(data as Row) : null;
  },
  async create(tenantId, slug, titleEs, titleEn, subtitleEs) {
    const hero = { title_es: titleEs, title_en: titleEn || titleEs, subtitle_es: subtitleEs, subtitle_en: "", image_url: null };
    const request_form = { title_es: "Solicitar cotización", submit_label_es: "Enviar", success_title_es: "¡Solicitud enviada!", success_message_es: "Te contactaremos pronto.", fields: [] };
    const seo = { meta_title_es: titleEs, meta_description_es: subtitleEs, canonical_path: `/servicios/${slug}` };
    const { data, error } = await supabase.from("tenant_service_pages")
      .insert({ tenant_id: tenantId, slug, is_active: false, hero, uses: [], specs: [], faq: [], request_form, seo }).select("id").maybeSingle();
    return ok(error, (data as { id: string } | null)?.id);
  },
  async save(id, p) {
    return ok((await supabase.from("tenant_service_pages").update({ hero: p.hero, uses: p.uses, specs: p.specs, faq: p.faq, request_form: p.requestForm, seo: p.seo, updated_at: new Date().toISOString() }).eq("id", id)).error);
  },
  async duplicate(tenantId, id) {
    const src = await this.get(id);
    if (!src) return { ok: false, error: "not_found" };
    const { data, error } = await supabase.from("tenant_service_pages")
      .insert({ tenant_id: tenantId, slug: `${src.slug}-copia`, is_active: false, hero: src.hero, uses: src.uses, specs: src.specs, faq: src.faq, request_form: src.requestForm, seo: src.seo }).select("id").maybeSingle();
    return ok(error, (data as { id: string } | null)?.id);
  },
  async remove(id) { return ok((await supabase.from("tenant_service_pages").delete().eq("id", id)).error); },
  async toggleActive(id, active) { return ok((await supabase.from("tenant_service_pages").update({ is_active: active }).eq("id", id)).error); },
};
