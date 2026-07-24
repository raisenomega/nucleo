import { Check } from "lucide-react";
import type { BlockContent } from "@campaigns/domain/campaign.types";

// Beneficios: lista de bullets con check en color primario. 1 col mobile / 2 desktop (campaign.css).
export function BenefitsBlock({ content }: { content: BlockContent }) {
  const title = typeof content.title === "string" ? content.title : "";
  const items = (Array.isArray(content.items) ? content.items : []).filter((x) => typeof x === "string") as string[];
  if (items.length === 0) return null;
  return (
    <section className="camp-benefits">
      {title && <h2 className="camp-sec-title">{title}</h2>}
      <ul className="camp-benefits-grid">
        {items.map((it, i) => <li key={i} className="camp-benefit"><Check className="camp-benefit-ic" />{it}</li>)}
      </ul>
    </section>
  );
}
