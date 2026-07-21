import { Plus, Sparkles } from "lucide-react";
import { periodLabel, isOneTime, oneTimeLabel } from "@raisen-marketing/data/billing-period";
import type { PricingAddonRow } from "@raisen-marketing/data/pricing.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Card de add-on. Distingue DOS naturalezas de cobro, porque leerlas mal cambia el precio percibido:
//   · recurrente  → "+$99/mes" con ícono Plus (se suma a la cuota del plan)
//   · pago único  → "$6,500 · pago único" con ícono Sparkles + pill, SIN el "+" (no es cuota)
export function PricingAddonCard({ addon, lang }: { addon: PricingAddonRow; lang: Lang }) {
  const es = lang === "es";
  const once = isOneTime(addon.billingPeriod);
  const Icon = once ? Sparkles : Plus;
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10"><Icon size={20} className="text-primary" /></div>
        {once && (
          <span className="rounded-full border border-primary/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {oneTimeLabel(lang)}
          </span>
        )}
      </div>
      <h3 className="font-display text-lg font-bold text-foreground">{es ? addon.nameEs : addon.nameEn}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{es ? addon.descEs : addon.descEn}</p>
      <p className="mt-4 font-display text-foreground">
        <span className="text-2xl font-bold text-primary">{once ? "" : "+"}${addon.price.toLocaleString()}</span>
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {addon.currency}{once ? ` · ${oneTimeLabel(lang)}` : periodLabel(addon.billingPeriod, lang)}
        </span>
      </p>
    </div>
  );
}
