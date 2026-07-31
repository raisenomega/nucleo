export type Result = { ok: true } | { ok: false; error: string };

// Oferta del hook (funnel aislado del catálogo). El billing real (Stripe Schedule + reversión) es Rodaja 2b.
export interface Offer {
  id: string; isActive: boolean;
  titleEs: string; titleEn: string;
  badgeTextEs: string; badgeTextEn: string;
  hookPrice: number;
  applicableServices: string[];   // service_ids
  commitmentCycles: number;
  disclosureEs: string; disclosureEn: string;
  ctaLabelEs: string; ctaLabelEn: string;
  askServiceType: boolean;
  modalQuestionEs: string; modalQuestionEn: string;
  validFrom: string | null; validUntil: string | null;
  displayOrder: number;
}
export type OfferInput = Omit<Offer, "id">;

export interface ILandingOffersRepository {
  list(): Promise<Offer[]>;
  create(tenantId: string, input: OfferInput): Promise<Result>;
  update(id: string, input: OfferInput): Promise<Result>;
  remove(id: string): Promise<Result>;
}
