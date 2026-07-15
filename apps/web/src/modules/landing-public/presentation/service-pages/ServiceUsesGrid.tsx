import { useI18n } from "@shared/i18n";
import { highlightIcon } from "@landing-public/utils/highlight-icon";
import type { SpUse } from "@landing-public/domain/service-page.types";

export function ServiceUsesGrid({ uses }: { uses: SpUse[] }) {
  const { locale } = useI18n();
  const en = locale === "en";
  if (!uses?.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uses.map((u, i) => {
          const Ic = highlightIcon(u.icon);
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <Ic className="h-6 w-6 text-[color:hsl(var(--tenant-accent-hsl))]" />
              <h3 className="mt-3 text-base font-bold text-foreground sm:text-lg">{en ? u.title_en : u.title_es}</h3>
              <p className="mt-1 text-sm text-[color:hsl(var(--lp-muted))]">{en ? u.description_en : u.description_es}</p>
            </div>);
        })}
      </div>
    </section>
  );
}
