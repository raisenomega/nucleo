import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");

// Bloque Hero: headline grande + subtítulo + CTA sobre imagen de fondo con overlay. Colores del tema (campaign.css).
export function HeroBlock({ content }: { content: BlockContent }) {
  const bg = s(content, "background_image_url");
  const overlay = typeof content.overlay_opacity === "number" ? (content.overlay_opacity as number) : 0.6;
  return (
    <section className="camp-hero" style={bg ? { backgroundImage: `url(${bg})` } : undefined}>
      <div className="camp-hero-overlay" style={{ opacity: overlay }} />
      <div className="camp-hero-inner">
        <h1 className="camp-hero-title">{s(content, "headline")}</h1>
        {s(content, "subtitle") && <p className="camp-hero-sub">{s(content, "subtitle")}</p>}
        {s(content, "cta_label") && <a href={s(content, "cta_action") || "#"} className="camp-btn">{s(content, "cta_label")}</a>}
      </div>
    </section>
  );
}
