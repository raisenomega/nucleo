import { Mail, AtSign, Share2, Globe } from "lucide-react";
import { COPY, type Lang } from "@raisen-marketing/data/copy";

// lucide-react 1.23 removió los íconos de marca (Instagram/Facebook/Linkedin) → placeholders genéricos.
// Los íconos reales por red vendrán del CMS (marketing_footer.social_*) en S3+.
const SOCIALS = [AtSign, Share2, Globe];

// Footer: 3 columnas (marca+tagline · contacto · redes) + línea de copyright con links legales.
export function MarketingFooter({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <footer className="border-t border-white/10 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <span className="text-xl font-bold tracking-tight text-white">NÚCLEO<span className="text-violet-400">.</span></span>
            <p className="mt-2 max-w-xs text-sm text-white/40">{c.footerTagline}</p>
          </div>
          <a href={`mailto:${c.footerEmail}`} className="flex items-center gap-2 self-start text-sm text-white/60 transition-colors hover:text-white"><Mail className="h-4 w-4" />{c.footerEmail}</a>
          <div className="flex gap-4">
            {SOCIALS.map((Icon, i) => <a key={i} href="#" aria-label="social" className="text-white/40 transition-colors hover:text-violet-400"><Icon className="h-5 w-5" /></a>)}
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/5 pt-8 text-center">
          <div className="flex gap-4 text-xs text-white/40">
            <a href="#" className="hover:text-white">{c.footerPrivacy}</a>
            <a href="#" className="hover:text-white">{c.footerTerms}</a>
          </div>
          <p className="text-xs text-white/20">{c.footerCopyright}</p>
        </div>
      </div>
    </footer>
  );
}
