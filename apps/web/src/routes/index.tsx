import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("tagline")}</p>
      </div>
    </main>
  );
}
