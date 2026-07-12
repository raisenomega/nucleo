import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useDetailSeo } from "@landing-public/presentation/detail/useDetailSeo.hook";
import { LegalLayout } from "@landing-public/presentation/legal/LegalLayout";

const SECTIONS: [TranslationKey, TranslationKey][] = [
  ["lpPrivacyDataSectionTitle", "lpPrivacyDataSectionBody"], ["lpPrivacyUseSectionTitle", "lpPrivacyUseSectionBody"],
  ["lpPrivacyThirdPartiesTitle", "lpPrivacyThirdPartiesBody"], ["lpPrivacyRightsTitle", "lpPrivacyRightsBody"],
  ["lpPrivacyContactTitle", "lpPrivacyContactBody"], ["lpPrivacyChangesTitle", "lpPrivacyChangesBody"],
];

export function PrivacyPage() {
  const { t } = useI18n();
  const s = usePublicBrand();
  const host = typeof window !== "undefined" ? window.location.hostname.replace(/^www\./, "") : "";
  useDetailSeo(s.status === "ready" ? `${t("lpPrivacyTitle")} | ${s.brand.displayName}` : undefined);
  if (s.status !== "ready") return <div className="min-h-screen bg-background" />;
  const v = { displayName: s.brand.displayName, email: s.brand.contactEmail || `contact@${host}`, phone: s.brand.contactPhone || "" };
  return (
    <LegalLayout brand={s.brand} title={t("lpPrivacyTitle")}>
      <p>{t("lpPrivacyIntro", v)}</p>
      {SECTIONS.map(([tk, bk]) => (
        <section key={tk}>
          <h2 className="text-lg font-bold text-[color:hsl(var(--lp-fg))]">{t(tk)}</h2>
          <p className="mt-2 text-[color:hsl(var(--lp-muted))]">{t(bk, v)}</p>
        </section>))}
    </LegalLayout>
  );
}
