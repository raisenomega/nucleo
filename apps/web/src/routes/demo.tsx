import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { demoHead } from "@shared/seo/marketing.head";

// Ruta PÚBLICA (sin login) /demo — agendar una demo. Lazy + aislada como la landing (marketing.css fuera del
// bundle del panel). Aesthetic landing (fondo oscuro rm-root).
const MarketingDemoPage = lazy(() => import("@raisen-marketing/components/demo/MarketingDemoPage"));

export const Route = createFileRoute("/demo")({ head: demoHead, component: Page });

function Page() {
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <Suspense fallback={<div className="min-h-screen bg-background" />}><MarketingDemoPage /></Suspense>;
}
