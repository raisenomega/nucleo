import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMounted } from "@shared/hooks/useMounted";
import { PublicBrandProvider } from "@landing-public/presentation/PublicBrandProvider";
import { CatalogPage } from "@landing-public/presentation/catalog/CatalogPage";

export const Route = createFileRoute("/catalog")({
  validateSearch: (s: Record<string, unknown>): { category?: string; type?: string } => ({
    category: typeof s.category === "string" ? s.category : undefined,
    type: typeof s.type === "string" ? s.type : undefined,
  }),
  component: Page,
});

function Page() {
  const { category, type } = Route.useSearch();
  const nav = useNavigate();
  const mounted = useMounted();
  if (!mounted) return <div className="min-h-screen bg-background" />;
  const onFilter = (patch: { category?: string; type?: string }) =>
    void nav({ to: "/catalog", search: (prev) => ({ ...prev, ...patch }) });
  return <PublicBrandProvider><CatalogPage category={category ?? null} type={type ?? "all"} onFilter={onFilter} /></PublicBrandProvider>;
}
