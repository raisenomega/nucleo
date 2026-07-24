import type { BlockContent } from "@campaigns/domain/campaign.types";

// Bloque de texto libre: párrafos (separados por saltos de línea) con alineación izquierda/centrada.
export function TextBlock({ content }: { content: BlockContent }) {
  const text = typeof content.content === "string" ? (content.content as string) : "";
  const align = content.alignment === "center" ? "center" : "left";
  return (
    <section className="camp-text" style={{ textAlign: align }}>
      {text.split("\n").filter(Boolean).map((line, i) => <p key={i}>{line}</p>)}
    </section>
  );
}
