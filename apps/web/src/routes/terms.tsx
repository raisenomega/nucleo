import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { TermsPage } from "@landing-public/presentation/legal/TermsPage";

export const Route = createFileRoute("/terms")({ component: Page });

function Page() {
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><TermsPage /></PublicBrandProvider>;
}
