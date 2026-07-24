import { Check } from "lucide-react";
import type { BlockContent } from "@campaigns/domain/campaign.types";

type P = { name?: string; price?: string | number; currency?: string; period?: string; features?: string | string[]; cta_label?: string; cta_action?: string; highlighted?: boolean | string };
const feats = (f: P["features"]) => (Array.isArray(f) ? (f as string[]) : typeof f === "string" ? f.split(",").map((x) => x.trim()).filter(Boolean) : []);

// Cards de precio; la `highlighted` con borde primario. Máx 3 en fila, apiladas en mobile (campaign.css).
export function PricingBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []) as P[];
  if (items.length === 0) return null;
  return (
    <section className="camp-pricing"><div className="camp-pricing-grid">
      {items.map((p, i) => {
        const hi = p.highlighted === true || p.highlighted === "1" || p.highlighted === "true";
        return (
          <div key={i} className={`camp-price-card ${hi ? "camp-price-hi" : ""}`}>
            <h3 className="camp-price-name">{p.name}</h3>
            <p className="camp-price-amt">{p.currency ?? "$"}{p.price}<span className="camp-price-per">{p.period ? `/${p.period}` : ""}</span></p>
            <ul className="camp-price-feats">{feats(p.features).map((f, j) => <li key={j}><Check className="camp-benefit-ic" />{f}</li>)}</ul>
            {p.cta_label && <a href={p.cta_action || "#"} className="camp-btn">{p.cta_label}</a>}
          </div>
        );
      })}
    </div></section>
  );
}
