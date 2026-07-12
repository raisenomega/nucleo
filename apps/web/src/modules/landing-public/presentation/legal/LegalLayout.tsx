import type { ReactNode } from "react";
import { useI18n } from "@shared/i18n";
import { DetailShell } from "@landing-public/presentation/detail/DetailShell";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";
import type { PublicBrand } from "@landing-public/domain/public-brand.types";

// Marco de las páginas legales: NavGlass (via DetailShell) + artículo max-w-3xl + footer. Fecha bilingüe fija.
export function LegalLayout({ brand, title, children }: { brand: PublicBrand; title: string; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <DetailShell brand={brand}>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 style={{ fontSize: "var(--text-h1)" }} className="font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[color:hsl(var(--lp-muted))]">{t("lpLegalLastUpdated")}</p>
        <div className="mt-8 space-y-6 leading-relaxed">{children}</div>
      </article>
      <PublicFooter brand={brand} tagline="" />
    </DetailShell>
  );
}
