import type { CSSProperties } from "react";
import { featureIcon } from "@raisen-marketing/data/feature-icons";
import type { BlockContent } from "@campaigns/domain/campaign.types";

type F = { icon_name?: string; title?: string; description?: string };

// Grid de features con ícono Lucide + título + descripción. Reutiliza el resolver de íconos del CMS (featureIcon).
export function FeaturesGridBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []) as F[];
  if (items.length === 0) return null;
  const cols = Math.min(4, Math.max(2, Number(content.columns) || 3));
  return (
    <section className="camp-fgrid" style={{ "--camp-cols": String(cols) } as CSSProperties}>
      {items.map((f, i) => {
        const Icon = featureIcon(f.icon_name ?? "");
        return (
          <div key={i} className="camp-fcard">
            <Icon className="camp-fic" />
            <h3 className="camp-fcard-title">{f.title}</h3>
            {f.description && <p className="camp-fcard-desc">{f.description}</p>}
          </div>
        );
      })}
    </section>
  );
}
