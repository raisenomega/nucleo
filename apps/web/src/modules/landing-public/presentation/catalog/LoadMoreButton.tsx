import { useI18n } from "@shared/i18n";
import { Spinner } from "@shared/components/loading";
import { FloatingButton } from "@landing-public/primitives/FloatingButton";

export function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mt-8 flex justify-center" aria-live="polite">
      <FloatingButton onClick={onClick} variant="ghost" size="lg" disabled={loading}>
        {loading ? <span className="inline-flex items-center gap-2"><Spinner size="sm" />{t("lpCatalogLoading")}</span> : t("lpCatalogLoadMore")}
      </FloatingButton>
    </div>
  );
}
