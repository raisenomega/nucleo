import { Phone, Mail, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { FooterSocials } from "@landing-public/presentation/footer/FooterSocials";
import type { PublicBrand } from "@landing-public/domain/public-brand.types";

// Footer medio: 3 columnas (marca / contacto / redes) + fila inferior (copyright + blog + legal placeholder).
export function PublicFooter({ brand, tagline, blogUrl }: { brand: PublicBrand; tagline: string; blogUrl?: string | null }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const s = brand.socialLinks;
  const wa = brand.contactPhone ? brand.contactPhone.replace(/[^0-9]/g, "") : "";
  return (
    <footer className="border-t border-[color:var(--glass-border)] px-6 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">{brand.logoUrl && <img src={brand.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}<span className="font-display text-lg font-bold">{brand.displayName}</span></div>
          {tagline && <p className="mt-2 text-sm text-[color:hsl(var(--lp-muted))]">{tagline}</p>}
        </div>
        <div>
          <h3 className="mb-3 font-bold">{t("lpFooterContactHeader")}</h3>
          <ul className="space-y-2 text-sm">
            {brand.contactPhone && <li><a href={`tel:${brand.contactPhone}`} className="flex items-center gap-2"><Phone className="h-4 w-4" />{brand.contactPhone}</a></li>}
            {brand.contactEmail && <li><a href={`mailto:${brand.contactEmail}`} className="flex items-center gap-2"><Mail className="h-4 w-4" />{brand.contactEmail}</a></li>}
            {wa && <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2"><MessageCircle className="h-4 w-4" />WhatsApp</a></li>}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-bold">{t("lpFooterSocialHeader")}</h3>
          <FooterSocials links={s} />
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-[color:var(--glass-border)] pt-6 text-xs text-[color:hsl(var(--lp-muted))]">
        <span>© {year} {brand.displayName}. {t("lpFooterRights")}.</span>
        <div className="flex flex-wrap items-center gap-4"><Link to="/portal/login">{t("lpLogin")}</Link>{blogUrl && <a href={blogUrl} target="_blank" rel="noreferrer">{t("lpFooterBlog")}</a>}<Link to="/privacy">{t("lpFooterPrivacy")}</Link><Link to="/terms">{t("lpFooterTerms")}</Link></div>
      </div>
    </footer>
  );
}
