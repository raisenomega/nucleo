import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { isRaisenHost } from "@shared/lib/brand-host";
import { useRaisenGuard } from "@shared/hooks/useRaisenGuard";
import { useMounted } from "@shared/hooks/useMounted";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  useRaisenGuard();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />; // SSR/1er render: placeholder neutro
  if (!isRaisenHost()) return null; // D4: en dominios de tenant redirige a /login (sin flash de marca Raisen)
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-primary">{t("title")}</h1>
        <p className="mt-4 text-muted-foreground">{t("tagline")}</p>
        <Link to="/login" className="mt-8 inline-block rounded-lg bg-primary text-primary-foreground px-6 py-3 font-body font-bold">{t("goToLogin")}</Link>
      </div>
    </main>
  );
}
