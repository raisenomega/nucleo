import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { PrivacyPage } from "@landing-public/presentation/legal/PrivacyPage";

export const Route = createFileRoute("/privacy")({ component: Page });

function Page() {
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><PrivacyPage /></PublicBrandProvider>;
}
