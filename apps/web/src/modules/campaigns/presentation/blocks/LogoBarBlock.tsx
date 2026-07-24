import type { BlockContent } from "@campaigns/domain/campaign.types";

type L = { image_url?: string; alt_text?: string; link_url?: string };

// Fila de logos de clientes/partners en escala de grises con hover a color (campaign.css). Wrap en mobile.
export function LogoBarBlock({ content }: { content: BlockContent }) {
  const items = (Array.isArray(content.items) ? content.items : []).filter((x) => (x as L).image_url) as L[];
  if (items.length === 0) return null;
  return (
    <section className="camp-logos">
      {items.map((l, i) => {
        const img = <img src={l.image_url} alt={l.alt_text ?? ""} loading="lazy" className="camp-logo" />;
        return l.link_url
          ? <a key={i} href={l.link_url} target="_blank" rel="noopener noreferrer">{img}</a>
          : <span key={i}>{img}</span>;
      })}
    </section>
  );
}
