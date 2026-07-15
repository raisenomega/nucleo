import { createFileRoute } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { ServicePageLayout } from "@landing-public/presentation/service-pages/ServicePageLayout";

export const Route = createFileRoute("/servicios/$slug")({
  validateSearch: (s: Record<string, unknown>): { preview?: boolean; pid?: string } => ({
    preview: s.preview === true || s.preview === "true", pid: typeof s.pid === "string" ? s.pid : undefined,
  }),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { preview, pid } = Route.useSearch();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  return <PublicBrandProvider><ServicePageLayout slug={slug} previewId={preview ? pid : undefined} /></PublicBrandProvider>;
}
