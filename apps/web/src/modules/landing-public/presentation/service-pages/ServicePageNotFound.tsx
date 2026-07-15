import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";

// Fallback cuando la página no existe o está desactivada (reemplaza la pantalla en blanco).
export function ServicePageNotFound() {
  const { t } = useI18n();
  return (
    <div className="lp-root flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <h1 className="font-display text-2xl font-bold">{t("spNotFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("spNotFoundDesc")}</p>
      <Link to="/" className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">{t("backToHome")}</Link>
    </div>
  );
}
