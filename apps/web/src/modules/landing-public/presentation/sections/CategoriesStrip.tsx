import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@shared/i18n";
import { categoryIcon } from "@landing-public/utils/category-icon";
import type { HomeCategory } from "@landing-public/domain/landing-home.types";

// Chips de categoría → navegan a /catalog?category={slug} (antes scrolleaban a #products).
export function CategoriesStrip({ categories }: { categories: HomeCategory[] }) {
  const { t } = useI18n();
  const nav = useNavigate();
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="mb-4 font-bold">{t("lpSectionCategories")}</h2>
      <div role="list" className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((c) => {
          const Icon = categoryIcon(c.icon_name);
          return (
            <button role="listitem" key={c.id} type="button" onClick={() => void nav({ to: "/catalog", search: { category: c.slug } })}
              className="flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--glass-border)] px-4 py-2 text-sm font-medium">
              <Icon className="h-4 w-4" /> {c.name}
            </button>);
        })}
      </div>
    </section>
  );
}
