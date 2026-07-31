import { useI18n } from "@shared/i18n";
import { ScreenModal } from "@shared/components/ScreenModal";
import type { PublicOffer } from "@landing-public/presentation/promo/useActiveOffer.hook";

// Modal selector del tipo de servicio de la oferta — un botón por servicio aplicable → abre su OrderModal.
export function OfferServiceSelector({ offer, services, onPick, onClose }: {
  offer: PublicOffer; services: { id: string; name: string }[]; onPick: (id: string) => void; onClose: () => void;
}) {
  const { locale } = useI18n();
  const q = locale === "en" ? offer.modal_question_en : offer.modal_question_es;
  return (
    <ScreenModal onClose={onClose}>
      <div className="space-y-4 p-6">
        <h2 className="text-center font-display text-xl font-bold text-foreground">{q}</h2>
        <div className="grid gap-3">
          {services.map((s) => (
            <button key={s.id} type="button" onClick={() => onPick(s.id)}
              className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-left font-bold text-foreground transition-colors hover:bg-primary/10">
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </ScreenModal>
  );
}
