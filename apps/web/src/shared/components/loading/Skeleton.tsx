import type { CSSProperties } from "react";

const BASE = "bg-muted animate-pulse";

// Placeholder de carga presentacional puro (semantic tokens). variant='text' con lines>1 → última línea al 60%.
export function Skeleton({ variant = "rect", width, height, lines = 1, className = "" }: {
  variant?: "text" | "rect" | "circle"; width?: string | number; height?: string | number; lines?: number; className?: string;
}) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-4 rounded-md ${BASE}`} style={{ width: i === lines - 1 ? "60%" : "100%" }} />
        ))}
      </div>
    );
  }
  const shape = variant === "circle" ? "aspect-square rounded-full" : "rounded-md";
  const h = variant === "text" ? "h-4" : "";
  return <div aria-hidden="true" style={{ width, height } as CSSProperties} className={`${BASE} ${shape} ${h} ${className}`} />;
}
