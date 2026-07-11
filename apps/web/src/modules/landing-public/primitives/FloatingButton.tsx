import type { ReactNode } from "react";
import { m } from "@landing-public/motion/motion-loader";
import { useReducedMotion } from "@landing-public/utils/reduced-motion";

export interface FloatingButtonProps {
  children: ReactNode; variant?: "primary" | "accent" | "ghost"; size?: "sm" | "md" | "lg";
  href?: string; onClick?: () => void; disabled?: boolean; className?: string; type?: "button" | "submit";
}
const SIZE = { sm: "px-4 py-2 text-sm", md: "px-6 py-3", lg: "px-8 py-4 text-lg" };

export function FloatingButton({ children, variant = "primary", size = "md", href, onClick, disabled, className = "", type = "button" }: FloatingButtonProps) {
  const reduced = useReducedMotion();
  const bg = variant === "primary" ? "hsl(var(--tenant-primary-hsl))" : variant === "accent" ? "hsl(var(--tenant-accent-hsl))" : undefined;
  const tone = variant === "ghost" ? "border border-[color:var(--glass-border)] text-[color:hsl(var(--lp-fg))]" : "text-white";
  const cls = `inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium ${SIZE[size]} ${tone} ${className}`;
  const anim = reduced ? {} : { whileHover: { scale: 1.04, y: -2 }, whileTap: { scale: 0.97 } };
  if (href) return <m.a href={href} style={{ background: bg }} className={cls} {...anim}>{children}</m.a>;
  return <m.button type={type} onClick={onClick} disabled={disabled} style={{ background: bg }} className={`${cls} disabled:opacity-50`} {...anim}>{children}</m.button>;
}
