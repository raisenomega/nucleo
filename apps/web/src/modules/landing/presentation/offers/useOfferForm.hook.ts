import { useState } from "react";
import type { Offer, OfferInput } from "@landing/domain/landing-offer.types";

export const OFFER_DEFAULTS: OfferInput = {
  isActive: false, titleEs: "", titleEn: "", badgeTextEs: "OFERTA TRENDING", badgeTextEn: "TRENDING OFFER",
  hookPrice: 19.98, applicableServices: [], commitmentCycles: 3, disclosureEs: "", disclosureEn: "",
  ctaLabelEs: "Aprovechar oferta", ctaLabelEn: "Get offer", termsEs: "", termsEn: "", askServiceType: true,
  modalQuestionEs: "¿Qué opción prefieres?", modalQuestionEn: "Which option do you prefer?",
  validFrom: null, validUntil: null, displayOrder: 0,
};

export type SetOffer = (p: Partial<OfferInput>) => void;

// Estado del formulario de oferta (extraído para que el modal quede orquestador puro).
export function useOfferForm(initial?: Offer) {
  const toInput = (o: Offer): OfferInput => { const { id: _id, ...rest } = o; void _id; return rest; };
  const [form, setForm] = useState<OfferInput>(initial ? toInput(initial) : OFFER_DEFAULTS);
  const set: SetOffer = (p) => setForm((f) => ({ ...f, ...p }));
  return { form, set };
}
