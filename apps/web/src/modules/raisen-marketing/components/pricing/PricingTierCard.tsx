import { Check } from "lucide-react";
import type { Tier } from "@raisen-marketing/data/pricing-tiers";
import type { Lang } from "@raisen-marketing/data/copy";

const scrollToForm = () => document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });

// Réplica del PricingTierCard de OMEGA: badge Recomendado, nombre, tagline, precio dorado + USD, features
// con Check. El botón (que en OMEGA iba a /auth) → scroll al #lead-form. Dorado = dorado (token primary) (tema .rm-root).
export function PricingTierCard({ tier, lang, recommendedLabel, cta }: { tier: Tier; lang: Lang; recommendedLabel: string; cta: string }) {
  const es = lang === "es";
  const features = es ? tier.featuresEs : tier.featuresEn;
  return (
    <div className={`relative flex flex-col rounded-xl border p-6 transition-all duration-300 ${tier.recommended ? "border-primary/40 bg-card shadow-lg shadow-primary/10" : "border-border bg-card hover:border-primary/20"}`}>
      {tier.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">{recommendedLabel}</span>}
      <h3 className="mt-2 font-display text-xl font-bold text-foreground">{es ? tier.nameEs : tier.nameEn}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{es ? tier.taglineEs : tier.taglineEn}</p>
      <p className="mt-4 font-display text-foreground">
        <span className="text-3xl font-bold text-primary">${tier.price.toLocaleString()}</span>
        <span className="ml-1 text-sm font-normal text-muted-foreground">USD</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => <li key={f} className="flex items-start gap-2 text-sm text-foreground"><Check size={16} className="mt-0.5 shrink-0 text-primary" />{f}</li>)}
      </ul>
      <button type="button" onClick={scrollToForm} className="mt-6 w-full rounded-lg bg-primary py-3 text-center text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]">{cta}</button>
    </div>
  );
}
