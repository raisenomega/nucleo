import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import type { TranslationKey } from "@shared/i18n";

// Genérico para las 3 detail pages: titleKey por entidad (default producto), link "volver al inicio".
export function DetailNotFound({ titleKey = "lpDetailNotFoundTitle" }: { titleKey?: TranslationKey }) {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 style={{ fontSize: "var(--text-h2)" }} className="font-bold">{t(titleKey)}</h1>
      <Link to="/" className="rounded-lg px-6 py-3 font-bold text-white" style={{ background: "hsl(var(--tenant-primary-hsl))" }}>{t("lpDetailNotFoundBack")}</Link>
    </main>
  );
}
