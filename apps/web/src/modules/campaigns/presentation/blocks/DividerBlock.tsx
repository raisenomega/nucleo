import type { BlockContent } from "@campaigns/domain/campaign.types";

// Divisor: línea, gradiente o espacio en blanco. `height` controla el margen (line/gradient) o la altura (space).
export function DividerBlock({ content }: { content: BlockContent }) {
  const style = content.style === "gradient" ? "gradient" : content.style === "space" ? "space" : "line";
  const height = typeof content.height === "string" && content.height ? content.height : "40px";
  if (style === "space") return <div style={{ height }} />;
  return <div className={`camp-divider camp-divider-${style}`} style={{ marginTop: height, marginBottom: height }} />;
}
