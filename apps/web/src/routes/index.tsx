import { createFileRoute } from "@tanstack/react-router";
import { ThemeToggle } from "@shared/components/ThemeToggle";
import { useI18n } from "@shared/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t, locale, setLocale } = useI18n();
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="fixed top-4 right-4 flex gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => setLocale(locale === "es" ? "en" : "es")}
          aria-label={t("switchLang")}
          className="bg-secondary text-foreground rounded-lg p-2 font-body"
        >
          {locale === "es" ? "EN" : "ES"}
        </button>
      </div>
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("tagline")}</p>
      </div>
    </main>
  );
}
