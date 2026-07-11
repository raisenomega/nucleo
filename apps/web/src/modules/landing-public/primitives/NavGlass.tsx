import type { ReactNode } from "react";

export interface NavGlassProps { children: ReactNode; sticky?: boolean; ariaLabel?: string; className?: string; }

// Nav con backdrop-blur + borde inferior sutil. El consumidor mete logo + links como children.
export function NavGlass({ children, sticky = true, ariaLabel, className = "" }: NavGlassProps) {
  return (
    <nav aria-label={ariaLabel} className={`${sticky ? "sticky top-0" : ""} z-40 flex items-center justify-between gap-4 border-b border-[color:var(--glass-border)] px-6 py-4 ${className}`}
      style={{ background: "var(--glass-bg)", backdropFilter: "blur(var(--glass-blur))", WebkitBackdropFilter: "blur(var(--glass-blur))" }}>
      {children}
    </nav>
  );
}
