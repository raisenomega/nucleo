// Encabezado de sección del home: título (custom o fallback i18n, ya resuelto por el caller) + subtítulo opcional.
// Compartido por FeaturedProducts/Services/Packages. Si no hay subtítulo, no renderiza espacio extra.
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div className="mb-6">
      <h2 style={{ fontSize: "var(--text-h2)" }} className="font-bold">{title}</h2>
      {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
