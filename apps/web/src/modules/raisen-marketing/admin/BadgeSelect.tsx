// Select inline con apariencia de badge de color (réplica de InlineBadgeSelect de OMEGA para Estado/
// Temperatura). Cambiar el valor dispara onChange → UPDATE inmediato.
export function BadgeSelect<T extends string>({ value, options, labels, colors, onChange }: {
  value: T; options: readonly T[]; labels: Record<T, string>; colors: Record<T, string>; onChange: (v: T) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={`shrink-0 rounded-full border px-2 py-1 text-xs ${colors[value]}`}>
      {options.map((o) => <option key={o} value={o} className="bg-card text-foreground">{labels[o]}</option>)}
    </select>
  );
}
