import type { BlockContent } from "@campaigns/domain/campaign.types";
import { safeHref } from "@shared/lib/safe-href";

type L = { image_url?: string; alt_text?: string; link_url?: string };

// Fila de logos de clientes/partners en escala de grises con hover a color (campaign.css). Wrap en mobile.
export function LogoBarBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []).filter((x) => (x as L).image_url) as L[];
  if (items.length === 0) return null;
  return (
    <section className="camp-logos">
      {items.map((l, i) => {
        const img = <img src={l.image_url} alt={l.alt_text ?? ""} loading="lazy" className="camp-logo" />;
        // link_url lo escribe el editor: esquema fuera de la allowlist (javascript:, data:…) → logo sin enlace.
        const href = safeHref(typeof l.link_url === "string" ? l.link_url : "", "");
        return href
          ? <a key={i} href={href} target="_blank" rel="noopener noreferrer">{img}</a>
          : <span key={i}>{img}</span>;
      })}
    </section>
  );
}
