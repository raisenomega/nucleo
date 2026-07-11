import { FloatingButton } from "@landing-public/primitives/FloatingButton";

// CTA final full-width con gradiente del tenant. El ancla #contact la dueña ContactSection (debajo).
export function FinalCta({ title, subtitle, ctaLabel, ctaHref }: { title: string; subtitle: string; ctaLabel: string; ctaHref: string }) {
  return (
    <section className="px-6 py-20 text-center text-white"
      style={{ background: "linear-gradient(135deg, hsl(var(--tenant-accent-hsl)), hsl(var(--tenant-primary-hsl)))" }}>
      <h2 style={{ fontSize: "var(--text-h2)" }} className="font-bold drop-shadow">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-white/90 drop-shadow">{subtitle}</p>
      <FloatingButton href={ctaHref} variant="ghost" size="lg" className="mt-8 !border-white !bg-white !text-black">{ctaLabel}</FloatingButton>
    </section>
  );
}
