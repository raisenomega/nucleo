import { lazy, Suspense, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PublicLandingRoot } from "@landing-public/presentation/PublicLandingRoot";
import { landingHead } from "@shared/seo/marketing.head";
import { getSeoData } from "@shared/seo/seo-data";
import { hostKind } from "@shared/seo/host";

// Landing comercial de Raisen (marketing) — lazy: su chunk (marketing.css, three.js) no entra al bundle
// inicial del panel ni al de @landing-public. En SSR el módulo se precarga en el loader para que el HTML
// del servidor salga con el contenido ya renderizado.
const MarketingLanding = lazy(() => import("@raisen-marketing"));

export const Route = createFileRoute("/")({
  // La rama se decide AQUÍ, no en el componente. Antes se resolvía con useMounted (solo cliente), y por eso
  // el servidor entregaba un shell vacío: cero <h1>, cero <section>. Los crawlers de IA no ejecutan JS, así
  // que veían una página en blanco. Al decidirlo en el loader, servidor y cliente coinciden y "/" puede SSR-ear.
  loader: async () => {
    const kind = hostKind();
    if (kind !== "raisen") return { kind, seo: null };
    if (typeof window !== "undefined") return { kind, seo: null }; // en cliente basta el fallback estático
    const [seo] = await Promise.all([getSeoData(), import("@raisen-marketing")]); // precarga el lazy para el SSR
    return { kind, seo };
  },
  head: ({ loaderData }) => landingHead(loaderData?.seo),
  component: Home,
});

function Home() {
  const { kind, seo } = Route.useLoaderData();
  if (kind !== "raisen") return <NonRaisen panel={kind === "panel"} />;
  // Las FAQs del loader siembran el acordeón para que el HTML del servidor traiga las preguntas REALES,
  // las mismas que declara el JSON-LD FAQPage. Sin esto el servidor emitiría el fallback y el structured
  // data no correspondería a lo visible.
  const faqs = seo?.faqs.map((f) => ({
    id: f.id, questionEs: f.qEs, questionEn: f.qEn, answerEs: f.aEs, answerEn: f.aEn,
    isActive: true, displayOrder: 0,
  })) ?? null;
  return <Suspense fallback={null}><MarketingLanding initialFaqs={faqs} /></Suspense>;
}

// Ramas de tenant: se mantienen client-only a propósito. La landing white-label resuelve su marca por
// hostname contra la DB y no está preparada para SSR; meterla aquí sería arriesgar el sitio de un cliente
// por una mejora que le corresponde a su propia rodaja.
function NonRaisen({ panel }: { panel: boolean }) {
  const nav = useNavigate();
  const mounted = useMounted();
  useEffect(() => { if (mounted && panel) void nav({ to: "/login" }); }, [mounted, panel, nav]);
  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (panel) return null; // redirigiendo a /login
  return <PublicBrandProvider><PublicLandingRoot /></PublicBrandProvider>;
}
