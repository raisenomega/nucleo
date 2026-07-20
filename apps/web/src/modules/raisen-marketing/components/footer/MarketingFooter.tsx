import { Mail, Phone } from "lucide-react";
import { useMarketingFooter } from "@raisen-marketing/hooks/useMarketingFooter";
import { useMarketingLegalLinks } from "@raisen-marketing/hooks/useMarketingLegalLinks";
import { FOOTER_FALLBACK } from "@raisen-marketing/data/footer-fallback";
import { LEGAL_LINKS_FALLBACK } from "@raisen-marketing/data/legal-fallback";
import { useMarketingFooterSocials } from "@raisen-marketing/hooks/useMarketingFooterSocials";
import { featureIcon } from "@raisen-marketing/data/feature-icons";
import { type Lang } from "@raisen-marketing/data/copy";

// Footer (réplica OMEGA): marca + tagline + contacto (email/phone si hay) · redes (solo las que tienen URL) ·
// copyright con {year} → año actual · links legales dinámicos (páginas is_active → /legal/{slug}). Lee la DB + fallback.
export function MarketingFooter({ lang }: { lang: Lang }) {
  const es = lang === "es";
  const f = useMarketingFooter() ?? FOOTER_FALLBACK;
  const legalLinks = useMarketingLegalLinks() ?? LEGAL_LINKS_FALLBACK;
  const socials = useMarketingFooterSocials();
  const copyright = (es ? f.copyrightEs : f.copyrightEn).replace("{year}", String(new Date().getFullYear()));
  return (
    <footer className="relative z-10 border-t border-white/10 bg-background/60 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <span className="font-display text-lg font-bold text-white">NÚCLEO<span className="text-primary">.</span></span>
            <p className="max-w-xs text-sm text-white/60">{es ? f.taglineEs : f.taglineEn}</p>
            <div className="flex flex-col gap-1 text-sm text-white/60">
              {f.contactEmail && <a href={`mailto:${f.contactEmail}`} className="flex items-center gap-2 transition-colors hover:text-primary"><Mail size={14} /> {f.contactEmail}</a>}
              {f.contactPhone && <a href={`tel:${f.contactPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 transition-colors hover:text-primary"><Phone size={14} /> {f.contactPhone}</a>}
            </div>
          </div>
          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s) => {
                const Icon = featureIcon(s.iconName);
                return <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform} className="text-white/60 transition-colors hover:text-primary"><Icon size={20} /></a>;
              })}
            </div>
          )}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>{copyright}</span>
          <div className="flex flex-wrap gap-4">
            {legalLinks.map((l) => <a key={l.slug} href={`/legal/${l.slug}`} className="transition-colors hover:text-primary">{es ? l.titleEs : l.titleEn}</a>)}
          </div>
        </div>
      </div>
    </footer>
  );
}
