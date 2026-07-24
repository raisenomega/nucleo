import type { BlockContent } from "@campaigns/domain/campaign.types";

const s = (c: BlockContent, k: string) => (typeof c[k] === "string" ? (c[k] as string) : "");

// Imagen centrada con caption opcional. loading="lazy" + max-width explícito (evita layout shift — Core Web Vitals).
export function ImageBlock({ content }: { content: BlockContent }) {
  const url = s(content, "image_url");
  if (!url) return null;
  const maxW = s(content, "max_width") || "640px";
  return (
    <figure className="camp-image">
      <img src={url} alt={s(content, "alt_text")} loading="lazy" style={{ maxWidth: maxW }} className="camp-image-img" />
      {s(content, "caption") && <figcaption className="camp-image-cap">{s(content, "caption")}</figcaption>}
    </figure>
  );
}
