import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");

// Bloque CTA banner: barra con headline + botón. `style=secondary` usa el color de acento en vez del primario.
export function CtaBannerBlock({ content }: { content: BlockContent }) {
  const secondary = content.style === "secondary";
  return (
    <section className={`camp-cta ${secondary ? "camp-cta-sec" : ""}`}>
      <h2 className="camp-cta-title">{s(content, "headline")}</h2>
      {s(content, "cta_label") && <a href={s(content, "cta_action") || "#"} className="camp-btn">{s(content, "cta_label")}</a>}
    </section>
  );
}
