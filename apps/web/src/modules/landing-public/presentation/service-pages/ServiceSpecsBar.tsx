import { useI18n } from "@shared/i18n";
import { highlightIcon } from "@landing-public/utils/highlight-icon";
import type { SpSpec } from "@landing-public/domain/service-page.types";

export function ServiceSpecsBar({ specs }: { specs: SpSpec[] }) {
  const { locale } = useI18n();
  const en = locale === "en";
  if (!specs?.length) return null;
  return (
    <section className="bg-[color:hsl(var(--lp-muted))]/5 py-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
        {specs.map((s, i) => {
          const Ic = highlightIcon(s.icon);
          return (
            <div key={i} className="flex flex-col items-center text-center">
              <Ic className="h-7 w-7 text-[color:hsl(var(--tenant-accent-hsl))]" />
              <span className="mt-2 text-lg font-extrabold text-foreground">{en ? s.value_en : s.value_es}</span>
              <span className="text-xs uppercase tracking-wider text-[color:hsl(var(--lp-muted))]">{en ? s.label_en : s.label_es}</span>
            </div>);
        })}
      </div>
    </section>
  );
}
