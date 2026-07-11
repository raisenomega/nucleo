import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";

export function DetailNotFound() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 style={{ fontSize: "var(--text-h2)" }} className="font-bold">{t("lpDetailNotFoundTitle")}</h1>
      <Link to="/" className="rounded-lg px-6 py-3 font-bold text-white" style={{ background: "hsl(var(--tenant-primary-hsl))" }}>{t("lpDetailNotFoundBack")}</Link>
    </main>
  );
}
