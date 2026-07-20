import { featureIcon } from "@raisen-marketing/data/feature-icons";
import type { MarketingFeatureRow } from "@raisen-marketing/data/feature.types";
import type { Lang } from "@raisen-marketing/data/copy";

// Réplica visual del ServiceCard de OMEGA: caja de ícono dorado, título, descripción y bullets con punto
// dorado. Ícono resuelto por nombre (DB). Clases `primary` = dorado del tema .rm-root. Reveal on scroll + colSpan.
export function ServiceCard({ feature, lang, index, isVisible }: { feature: MarketingFeatureRow; lang: Lang; index: number; isVisible: boolean }) {
  const Icon = featureIcon(feature.iconName);
  const es = lang === "es";
  const bullets = es ? feature.bulletsEs : feature.bulletsEn;
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-border bg-card p-8 transition-all duration-700 hover:border-primary/40 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.25)] ${feature.colSpan === 2 ? "md:col-span-2" : ""} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${200 + index * 150}ms` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/40">
          <Icon size={22} />
        </div>
        <h3 className="mb-3 font-display text-xl font-bold text-foreground">{es ? feature.titleEs : feature.titleEn}</h3>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{es ? feature.descEs : feature.descEn}</p>
        <ul className="space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />{b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
