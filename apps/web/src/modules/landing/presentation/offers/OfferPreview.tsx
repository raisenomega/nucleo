import type { OfferInput } from "@landing/domain/landing-offer.types";

// Preview del chip + del cálculo de reversión (Cálculo A: reversión = recurrente − hook, un ciclo).
export function OfferPreview({ c }: { c: OfferInput }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-xs font-bold text-muted-foreground">Vista previa</p>
      <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">🔥 {c.badgeTextEs || "OFERTA TRENDING"}</span>
      <p className="text-xs text-muted-foreground">
        Primer ciclo <b className="text-foreground">${c.hookPrice.toFixed(2)}</b>, luego el precio recurrente del servicio.
        Compromiso de <b className="text-foreground">{c.commitmentCycles}</b> ciclos. Si el cliente cancela antes, se cobra
        una reversión de <b className="text-foreground">(precio recurrente − ${c.hookPrice.toFixed(2)})</b> — el descuento del primer ciclo.
      </p>
    </div>
  );
}
