import { SearchX, AlertCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { isReady, isLoading, isError } from "@shared/types/fetch-state.types";
import { EmptyState } from "@shared/components/loading";
import { usePublicBrand } from "@landing-public/presentation/usePublicBrand.hook";
import { useLandingHome } from "@landing-public/presentation/useLandingHome.hook";
import { useLandingCatalog } from "@landing-public/presentation/useLandingCatalog.hook";
import { useDetailSeo } from "@landing-public/presentation/detail/useDetailSeo.hook";
import { DetailShell } from "@landing-public/presentation/detail/DetailShell";
import { CatalogFilters } from "@landing-public/presentation/catalog/CatalogFilters";
import { CatalogGrid } from "@landing-public/presentation/catalog/CatalogGrid";
import { CatalogGridSkeleton } from "@landing-public/presentation/catalog/CatalogGridSkeleton";
import { LoadMoreButton } from "@landing-public/presentation/catalog/LoadMoreButton";
import { PublicFooter } from "@landing-public/presentation/footer/PublicFooter";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";

export function CatalogPage({ category, type, onFilter }: {
  category: string | null; type: string; onFilter: (p: { category?: string; type?: string }) => void;
}) {
  const { t } = useI18n();
  const s = usePublicBrand();
  const home = useLandingHome();
  const cats = isReady(home) ? home.data.categories : [];
  const { state, items, hasMore, loadMore, retry } = useLandingCatalog(category, type);
  useDetailSeo(s.status === "ready" ? `${t("lpCatalogTitle")} | ${s.brand.displayName}` : undefined);
  if (s.status !== "ready") return <div className="min-h-screen bg-background" />;
  const clear = () => onFilter({ category: undefined, type: undefined });
  return (
    <DetailShell brand={s.brand}>
      <header className="mx-auto max-w-7xl px-6 pt-8">
        <nav aria-label="breadcrumb" className="text-sm text-[color:hsl(var(--lp-muted))]">
          <Link to="/" className="hover:underline">{t("lpDetailBreadcrumbHome")}</Link><span className="mx-2" aria-hidden>›</span><span className="text-[color:hsl(var(--lp-fg))]">{t("lpCatalogTitle")}</span>
        </nav>
        <h1 style={{ fontSize: "var(--text-h1)" }} className="mt-3 font-bold">{t("lpCatalogTitle")}</h1>
        <CatalogFilters categories={cats} category={category} type={type} onFilter={onFilter} />
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading(state) && items.length === 0 ? <CatalogGridSkeleton />
          : isError(state) && items.length === 0 ? <EmptyState icon={AlertCircle} title={t("lpCatalogErrorTitle")} size="lg"><FloatingButton onClick={retry}>{t("lpCatalogErrorRetry")}</FloatingButton></EmptyState>
          : items.length === 0 ? <EmptyState icon={SearchX} title={t("lpCatalogEmptyTitle")} description={t("lpCatalogEmptyDescription")} size="lg"><FloatingButton onClick={clear}>{t("lpCatalogClearFilters")}</FloatingButton></EmptyState>
          : <><CatalogGrid items={items} />{hasMore && <LoadMoreButton loading={isLoading(state)} onClick={loadMore} />}</>}
      </div>
      <PublicFooter brand={s.brand} tagline="" />
    </DetailShell>
  );
}
