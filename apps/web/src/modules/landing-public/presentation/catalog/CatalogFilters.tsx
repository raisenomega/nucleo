import { CategoryChips } from "@landing-public/presentation/catalog/CategoryChips";
import { TypeSegmented } from "@landing-public/presentation/catalog/TypeSegmented";
import type { HomeCategory } from "@landing-public/domain/landing-home.types";

export function CatalogFilters({ categories, category, type, onFilter }: {
  categories: HomeCategory[]; category: string | null; type: string; onFilter: (p: { category?: string; type?: string }) => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      <CategoryChips categories={categories} active={category} onSelect={(slug) => onFilter({ category: slug ?? undefined })} />
      <TypeSegmented active={type} onSelect={(v) => onFilter({ type: v === "all" ? undefined : v })} />
    </div>
  );
}
