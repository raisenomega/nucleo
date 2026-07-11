import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";

// Breadcrumb + h1 del item. Reutilizable para service/package detail. sectionHash = ancla en la home.
export function DetailHeader({ name, sectionLabel, sectionHash }: { name: string; sectionLabel: string; sectionHash: string }) {
  const { t } = useI18n();
  return (
    <header className="mx-auto max-w-7xl px-6 pt-8 pb-6">
      <nav aria-label="breadcrumb" className="text-sm text-[color:hsl(var(--lp-muted))]">
        <Link to="/" className="hover:underline">{t("lpDetailBreadcrumbHome")}</Link>
        <span className="mx-2" aria-hidden>›</span>
        <Link to="/" hash={sectionHash} className="hover:underline">{sectionLabel}</Link>
        <span className="mx-2" aria-hidden>›</span>
        <span className="text-[color:hsl(var(--lp-fg))]">{name}</span>
      </nav>
      <h1 style={{ fontSize: "var(--text-h1)" }} className="mt-3 font-bold">{name}</h1>
    </header>
  );
}
