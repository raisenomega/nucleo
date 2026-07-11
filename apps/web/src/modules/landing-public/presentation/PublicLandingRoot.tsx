import { useI18n } from "@shared/i18n";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";

// Home pública mínima (3.E.2.a): prueba que el provider resuelve. Diseño real en 3.E.2.b-d.
export function PublicLandingRoot() {
  const { t } = useI18n();
  const s = usePublicBrand();
  if (s.status === "loading") return <div className="min-h-screen bg-background" />;
  if (s.status === "fallback") {
    const bare = typeof window !== "undefined" ? window.location.hostname.replace(/^www\./, "") : "";
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-foreground">
        <h1 className="font-display text-2xl font-bold">{t("lpFallbackTitle")}</h1>
        <p className="max-w-md text-muted-foreground">{t("lpFallbackMsg")}</p>
        <a href={`https://app.${bare}`} className="rounded-lg bg-primary px-6 py-3 font-body font-bold text-primary-foreground">{t("lpGoToPanel")}</a>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <h1 className="font-display text-5xl font-bold text-primary">{s.brand.displayName}</h1>
    </main>
  );
}
