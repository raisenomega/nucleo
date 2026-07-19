import { Mail, AtSign, Share2, Globe } from "lucide-react";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// lucide 1.23 removió íconos de marca → placeholders genéricos (los reales vienen del CMS en S3+).
const SOCIALS = [AtSign, Share2, Globe];

// Footer (réplica OMEGA LandingFooter): marca NÚCLEO. + tagline + email · fila social · copyright + legales.
export function MarketingFooter({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <footer className="relative z-10 border-t border-white/10 bg-background/60 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <span className="font-display text-lg font-bold text-white">NÚCLEO<span className="text-primary">.</span></span>
            <p className="max-w-xs text-sm text-white/60">{c.footerTagline}</p>
            <a href={`mailto:${c.footerEmail}`} className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-primary"><Mail size={14} /> {c.footerEmail}</a>
          </div>
          <div className="flex gap-4">
            {SOCIALS.map((Icon, i) => <a key={i} href="#" aria-label="social" className="text-white/60 transition-colors hover:text-primary"><Icon size={20} /></a>)}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 NÚCLEO. {c.footerCopyright}</span>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition-colors hover:text-primary">{c.footerPrivacy}</a>
            <a href="#" className="transition-colors hover:text-primary">{c.footerTerms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
