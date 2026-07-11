import type { ReactNode } from "react";

export interface HeroContainerProps { children: ReactNode; mediaSlot?: ReactNode; className?: string; }

// Full-viewport (100dvh). mediaSlot = capa de fondo (video/img/gradient); children = contenido glass encima.
export function HeroContainer({ children, mediaSlot, className = "" }: HeroContainerProps) {
  return (
    <section className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden ${className}`}>
      {mediaSlot && <div className="absolute inset-0 -z-10">{mediaSlot}</div>}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">{children}</div>
    </section>
  );
}
