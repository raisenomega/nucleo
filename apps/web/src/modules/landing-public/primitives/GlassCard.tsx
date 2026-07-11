import type { ReactNode } from "react";

export interface GlassCardProps {
  children: ReactNode; className?: string;
  elevation?: "sm" | "md" | "lg" | "xl"; padding?: "sm" | "md" | "lg"; as?: "div" | "article" | "section";
}
const SHADOW = { sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)", xl: "var(--shadow-xl)" };
const PAD = { sm: "p-4", md: "p-6", lg: "p-8 md:p-10" };

export function GlassCard({ children, className = "", elevation = "lg", padding = "md", as: Tag = "div" }: GlassCardProps) {
  return <Tag style={{ boxShadow: SHADOW[elevation] }} className={`glass-card ${PAD[padding]} ${className}`}>{children}</Tag>;
}
