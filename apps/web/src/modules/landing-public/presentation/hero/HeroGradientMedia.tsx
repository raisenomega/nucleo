// Fondo del hero (placeholder 3.E.2.d): gradiente diagonal con los colores del tenant + scrim para
// legibilidad. Consume --tenant-primary-hsl/--tenant-accent-hsl (seteadas por PublicBrandProvider).
export function HeroGradientMedia() {
  return (
    <div className="h-full w-full"
      style={{ background: "linear-gradient(135deg, hsl(var(--tenant-accent-hsl)), hsl(var(--tenant-primary-hsl)))" }}>
      <div className="h-full w-full bg-black/25" />
    </div>
  );
}
