// Subtítulo de sección del form (group_name) + descripción opcional. Ocupa la fila completa del grid.
export function SectionHeader({ title, description }: { title: string; description: string | null }) {
  return (
    <div className="mt-2 border-b border-border pb-1 md:col-span-2">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
