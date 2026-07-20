import { Plus } from "lucide-react";
import { periodLabel } from "@raisen-marketing/data/billing-period";
import type { PricingAddonRow } from "@raisen-marketing/data/pricing.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Réplica del PricingAddonCard de OMEGA: caja de ícono Plus dorada + nombre + descripción + "+$precio"
// con período. Puramente informativo (sin CTA · el checkout va aparte).
export function PricingAddonCard({ addon, lang }: { addon: PricingAddonRow; lang: Lang }) {
  const es = lang === "es";
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10"><Plus size={20} className="text-primary" /></div>
      <h3 className="font-display text-lg font-bold text-foreground">{es ? addon.nameEs : addon.nameEn}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{es ? addon.descEs : addon.descEn}</p>
      <p className="mt-4 font-display text-foreground">
        <span className="text-2xl font-bold text-primary">+${addon.price.toLocaleString()}</span>
        <span className="ml-1 text-sm font-normal text-muted-foreground">{addon.currency}{periodLabel(addon.billingPeriod, lang)}</span>
      </p>
    </div>
  );
}
