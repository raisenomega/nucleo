import { useI18n } from "@shared/i18n";
import type { SpHero } from "@landing-public/domain/service-page.types";

const isVid = (u: string) => /\.(mp4|webm|mov)$/i.test(u);
export function ServicePageHero({ hero }: { hero: SpHero }) {
  const { locale } = useI18n();
  const en = locale === "en";
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:py-16">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-[color:hsl(var(--lp-muted))]/10 shadow-xl">
        {hero.image_url && (isVid(hero.image_url)
          ? <video src={hero.image_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          : <img src={hero.image_url} alt={en ? hero.image_alt_en : hero.image_alt_es} width={1024} height={768} loading="eager" className="h-full w-full object-cover" />)}
      </div>
      <div className="flex flex-col items-start gap-4">
        <span className="inline-block rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">{en ? hero.badge_en : hero.badge_es}</span>
        <h1 className="text-balance text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl">{en ? hero.title_en : hero.title_es}</h1>
        <p className="text-pretty text-sm text-[color:hsl(var(--lp-muted))] sm:text-base md:text-lg">{en ? hero.subtitle_en : hero.subtitle_es}</p>
        <a href="#solicitar" className="mt-2 rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">{en ? "Request a quote" : "Solicitar cotización"}</a>
      </div>
    </section>
  );
}
