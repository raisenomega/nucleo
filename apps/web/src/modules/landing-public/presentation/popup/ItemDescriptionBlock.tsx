// Descripción larga del item en el popup. Preserva saltos de línea. Null/vacío → no renderiza.
export function ItemDescriptionBlock({ text }: { text: string | null }) {
  if (!text?.trim()) return null;
  return <p className="whitespace-pre-line text-sm text-[color:hsl(var(--lp-muted))]">{text}</p>;
}
