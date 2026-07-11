import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { isRaisenHost } from "@shared/lib/brand-host";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PublicLandingRoot } from "@landing-public/presentation/PublicLandingRoot";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const nav = useNavigate();
  const mounted = useMounted();
  const host = mounted ? window.location.hostname : "";
  const isLanding = mounted && !isRaisenHost() && !host.startsWith("app."); // dominio raíz del tenant → landing pública
  useEffect(() => { // app.{tenant}.com → panel; el resto no-Raisen no-app → landing (no redirige)
    if (mounted && !isRaisenHost() && host.startsWith("app.")) void nav({ to: "/login" });
  }, [mounted, host, nav]);
  if (!mounted) return <div className="min-h-screen bg-background" />; // SSR/1er render: placeholder neutro
  if (isLanding) return <PublicBrandProvider><PublicLandingRoot /></PublicBrandProvider>;
  if (!isRaisenHost()) return null; // app.* → redirigiendo a /login
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
