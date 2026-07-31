import { supabase } from "@shared/lib/supabase";
import type { ILandingOffersRepository, Offer, OfferInput, Result } from "@landing/domain/landing-offer.types";

const ok = (e: { message: string } | null): Result => (e ? { ok: false, error: e.message } : { ok: true });
const SEL = "id,is_active,title_es,title_en,badge_text_es,badge_text_en,hook_price,applicable_services,commitment_cycles,disclosure_es,disclosure_en,cta_label_es,cta_label_en,ask_service_type,modal_question_es,modal_question_en,valid_from,valid_until,display_order";

interface Row { [k: string]: unknown }
const toOffer = (r: Row): Offer => ({
  id: r.id as string, isActive: r.is_active as boolean,
  titleEs: (r.title_es as string) ?? "", titleEn: (r.title_en as string) ?? "",
  badgeTextEs: (r.badge_text_es as string) ?? "", badgeTextEn: (r.badge_text_en as string) ?? "",
  hookPrice: Number(r.hook_price ?? 0), applicableServices: (r.applicable_services as string[]) ?? [],
  commitmentCycles: (r.commitment_cycles as number) ?? 3,
  disclosureEs: (r.disclosure_es as string) ?? "", disclosureEn: (r.disclosure_en as string) ?? "",
  ctaLabelEs: (r.cta_label_es as string) ?? "", ctaLabelEn: (r.cta_label_en as string) ?? "",
  askServiceType: (r.ask_service_type as boolean) ?? true,
  modalQuestionEs: (r.modal_question_es as string) ?? "", modalQuestionEn: (r.modal_question_en as string) ?? "",
  validFrom: (r.valid_from as string) ?? null, validUntil: (r.valid_until as string) ?? null,
  displayOrder: (r.display_order as number) ?? 0,
});
const fromOffer = (c: OfferInput) => ({
  is_active: c.isActive, title_es: c.titleEs, title_en: c.titleEn, badge_text_es: c.badgeTextEs, badge_text_en: c.badgeTextEn,
  hook_price: c.hookPrice, applicable_services: c.applicableServices, commitment_cycles: c.commitmentCycles,
  disclosure_es: c.disclosureEs, disclosure_en: c.disclosureEn, cta_label_es: c.ctaLabelEs, cta_label_en: c.ctaLabelEn,
  ask_service_type: c.askServiceType, modal_question_es: c.modalQuestionEs, modal_question_en: c.modalQuestionEn,
  valid_from: c.validFrom || null, valid_until: c.validUntil || null, display_order: c.displayOrder,
});

export const supabaseLandingOffersRepository: ILandingOffersRepository = {
  async list(): Promise<Offer[]> {
    const { data } = await supabase.from("tenant_landing_offers").select(SEL).order("display_order");
    return ((data as Row[] | null) ?? []).map(toOffer);
  },
  async create(tenantId, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_offers").insert({ tenant_id: tenantId, ...fromOffer(input) })).error);
  },
  async update(id, input): Promise<Result> {
    return ok((await supabase.from("tenant_landing_offers").update(fromOffer(input)).eq("id", id)).error);
  },
  async remove(id): Promise<Result> {
    return ok((await supabase.from("tenant_landing_offers").delete().eq("id", id)).error);
  },
};
