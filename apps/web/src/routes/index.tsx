import { lazy, Suspense, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { isRaisenHost } from "@shared/lib/brand-host";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PublicLandingRoot } from "@landing-public/presentation/PublicLandingRoot";
import { landingHead } from "@shared/seo/marketing.head";
import { getSeoData } from "@shared/seo/seo-data";

// Landing comercial de Raisen (marketing) — lazy + aislada: no entra al bundle del panel ni de @landing-public.
const MarketingLanding = lazy(() => import("@raisen-marketing"));

export const Route = createFileRoute("/")({
  // Precios y FAQs del JSON-LD salen de la DB. Se resuelve SOLO en servidor: es el HTML del SSR lo que leen
  // los crawlers, y así la navegación en cliente no paga un fetch extra (cae al fallback estático).
  loader: async () => (typeof window === "undefined" ? await getSeoData() : null),
  head: ({ loaderData }) => landingHead(loaderData),
  component: Home,
});

function Home() {
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
  return <Suspense fallback={null}><MarketingLanding /></Suspense>; // hostname Raisen → landing comercial
}
