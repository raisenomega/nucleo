import { Mail, Phone } from "lucide-react";
import { useMarketingFooter } from "@raisen-marketing/hooks/useMarketingFooter";
import { FOOTER_FALLBACK } from "@raisen-marketing/data/footer-fallback";
import { SOCIAL_DEFS } from "@raisen-marketing/data/footer-socials";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// Footer (réplica OMEGA): marca + tagline + contacto (email/phone si hay) · redes (solo las que tienen URL) ·
// copyright con {year} → año actual · legales. Lee la fila única de la DB (editable en /web/footer) + fallback.
export function MarketingFooter({ lang }: { lang: Lang }) {
  const es = lang === "es";
  const c = COPY[lang];
  const f = useMarketingFooter() ?? FOOTER_FALLBACK;
  const socials = SOCIAL_DEFS.map((d) => ({ ...d, url: f[d.key] as string | null })).filter((d) => d.url);
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
              {socials.map(({ key, Icon, label, url }) => (
                <a key={key} href={url!} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/60 transition-colors hover:text-primary"><Icon size={20} /></a>
              ))}
            </div>
          )}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>{copyright}</span>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition-colors hover:text-primary">{c.footerPrivacy}</a>
            <a href="#" className="transition-colors hover:text-primary">{c.footerTerms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
